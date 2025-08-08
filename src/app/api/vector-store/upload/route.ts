import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

import { uploadFileToVectorStore } from '@/utils/vector-store-helpers'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
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
