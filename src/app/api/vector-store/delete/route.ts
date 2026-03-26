import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

import { deleteCrawlFromR2, deleteFileFromR2 } from '@/utils/r2-helpers'
import { clearWebsiteKnowledgeFileId, getWebsiteKnowledge } from '@/utils/turso'
import {
  deleteFileFromVectorStore,
  getUserVectorStoreDocuments,
} from '@/utils/vector-store-helpers'

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileId } = await req.json()

    if (!fileId) {
      return Response.json({ error: 'No file ID provided' }, { status: 400 })
    }

    // Ensure the file belongs to the user's vector store before deleting
    const documents = await getUserVectorStoreDocuments(userId)
    if (!documents) {
      return Response.json(
        { error: 'No vector store found for user' },
        { status: 404 }
      )
    }

    const fileInUserStore = documents.some((doc) => doc.id === fileId)
    if (!fileInUserStore) {
      return Response.json(
        { error: "File not found in user's vector store" },
        { status: 404 }
      )
    }

    // Check if this is a crawl file before deleting (need the reference intact)
    const wk = await getWebsiteKnowledge(userId)
    const isCrawlFile = wk?.vectorStoreFileId === fileId

    // Delete file from user's vector store
    const result = await deleteFileFromVectorStore(userId, fileId)

    if (!result) {
      return Response.json(
        { error: 'Failed to delete file from vector store' },
        { status: 500 }
      )
    }

    if (isCrawlFile) {
      // Crawl file: delete from crawl R2 path and clear DB reference
      deleteCrawlFromR2(userId).catch((err) =>
        console.error('[r2] Background crawl backup delete failed:', err)
      )
      clearWebsiteKnowledgeFileId(fileId).catch((err) =>
        console.error('[turso] Background clear crawl file ID failed:', err)
      )
    } else {
      // Regular document: delete from standard R2 path
      deleteFileFromR2(userId, fileId).catch((err) =>
        console.error('[r2] Background delete failed:', err)
      )
    }

    return Response.json({
      success: result,
      message: 'File deleted successfully',
    })
  } catch (error) {
    console.error('Error bulk deleting files from vector store:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
