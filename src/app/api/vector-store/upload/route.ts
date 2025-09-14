import { auth, currentUser } from '@clerk/nextjs/server'
import { fileTypeFromBuffer } from 'file-type'
import { NextRequest } from 'next/server'

import { hasAnyPlan } from '@/utils/clerk/subscription'
import {
  getUserVectorStoreDocuments,
  uploadFileToVectorStore,
} from '@/utils/vector-store-helpers'

export async function POST(req: NextRequest) {
  try {
    const { userId, has } = await auth()

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await currentUser()

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Ensure user has an eligible paid plan or matching trial tier (e.g., basic)
    const isEligible = hasAnyPlan(has, 'basic', user.publicMetadata)
    if (!isEligible) {
      return Response.json(
        { error: 'Requires an active paid plan' },
        { status: 403 }
      )
    }

    const documents = await getUserVectorStoreDocuments(userId)

    // Enforce file upload limit from Clerk public metadata
    const filesLimit = user.publicMetadata?.filesLimit as number
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

    // Enforce total storage limit from Clerk public metadata (in megabytes)
    const totalStorageLimit = user.publicMetadata?.totalStorageLimit as number
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
