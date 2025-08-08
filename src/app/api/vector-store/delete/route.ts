import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

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
        { error: 'File not found in user\'s vector store' },
        { status: 404 }
      )
    }

    // Delete file from user's vector store
    const result = await deleteFileFromVectorStore(userId, fileId)

    if (!result) {
      return Response.json(
        { error: 'Failed to delete file from vector store' },
        { status: 500 }
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
