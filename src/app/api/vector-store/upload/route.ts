import { auth } from '@clerk/nextjs/server'
import { fileTypeFromBuffer } from 'file-type'
import { NextRequest } from 'next/server'

import { hasAnyPlan } from '@/utils/clerk/subscription'
import { PLUS_ONLY_PLAN } from '@/utils/plans'
import { uploadFileToR2 } from '@/utils/r2-helpers'
import { getUserData, getWebsiteKnowledge } from '@/utils/turso'
import {
  deleteFileFromVectorStore,
  getUserVectorStoreDocuments,
  uploadFileToVectorStore,
} from '@/utils/vector-store-helpers'

export async function POST(req: NextRequest) {
  try {
    const { userId, has } = await auth()

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user has an eligible paid plan or matching trial tier (e.g., basic)
    const isEligible = await hasAnyPlan(has, PLUS_ONLY_PLAN, userId)
    if (!isEligible) {
      return Response.json(
        { error: 'Requires an active paid plan' },
        { status: 403 }
      )
    }

    // Get user data, documents, and crawl record in parallel
    const [userData, rawDocuments, wk] = await Promise.all([
      getUserData(userId),
      getUserVectorStoreDocuments(userId),
      getWebsiteKnowledge(userId),
    ])

    // Exclude crawl file from quota calculations
    const crawlFileId = wk?.vectorStoreFileId ?? null
    if (!rawDocuments) {
      return Response.json(
        { error: 'No vector store found for user' },
        { status: 404 }
      )
    }
    const documents = rawDocuments.filter((doc) => doc.id !== crawlFileId)

    // Enforce file upload limit from database
    const filesLimit = userData?.documentCount ?? 0
    const currentCount = documents.length
    if (currentCount >= filesLimit) {
      return Response.json(
        { error: `File limit reached (${filesLimit})` },
        { status: 403 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate MIME type using magic bytes (read only the head for efficiency)
    const allowedMime = new Set([
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ])
    const head = Buffer.from(await file.slice(0, 4100).arrayBuffer())
    const guessed = await fileTypeFromBuffer(head)
    const mime = guessed?.mime || file.type || ''
    if (!allowedMime.has(mime)) {
      return Response.json(
        { error: `Unsupported file type: ${mime || 'unknown'}` },
        { status: 400 }
      )
    }

    // Enforce total storage limit from database (in bytes)
    const totalStorageLimit = userData?.totalStorageLimit ?? 0
    const currentTotalBytes = documents.reduce((sum, doc) => {
      const size = doc.sizeBytes
      return sum + size
    }, 0)
    const proposedTotalBytes = currentTotalBytes + file.size
    if (proposedTotalBytes > totalStorageLimit) {
      return Response.json(
        {
          error: `Total storage limit exceeded (${totalStorageLimit} bytes)`,
        },
        { status: 403 }
      )
    }

    // Upload file to user's vector store
    const vectorStoreFileId = await uploadFileToVectorStore(
      userId,
      file,
      file.name
    )

    if (!vectorStoreFileId) {
      return Response.json(
        { error: 'Failed to upload file to vector store' },
        { status: 500 }
      )
    }

    // Back up the file to R2 — if this fails, roll back the vector store upload
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const r2Success = await uploadFileToR2(
      userId,
      vectorStoreFileId,
      file.name,
      fileBuffer,
      mime
    )

    if (!r2Success) {
      // Roll back: remove the file we just added to the vector store
      await deleteFileFromVectorStore(userId, vectorStoreFileId).catch((err) =>
        console.error(
          '[r2] Rollback delete from vector store also failed:',
          err
        )
      )
      return Response.json(
        { error: 'Failed to back up file to storage' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      vectorStoreFileId,
      fileName: file.name,
    })
  } catch (error) {
    console.error('Error uploading file to vector store:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
