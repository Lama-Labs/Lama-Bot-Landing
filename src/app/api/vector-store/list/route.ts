import { auth } from '@clerk/nextjs/server'

import { getUserVectorStoreDocuments } from '@/utils/vector-store-helpers'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all documents from user's vector store
    const documents = await getUserVectorStoreDocuments(userId)

    if (documents === null) {
      return Response.json(
        { error: 'No vector store found for user' },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      documents,
      totalDocuments: documents.length,
    })
  } catch (error) {
    console.error('Error retrieving documents from vector store:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
