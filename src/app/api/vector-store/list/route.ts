import { auth } from '@clerk/nextjs/server'

import { hasAnyPlan } from '@/utils/clerk/subscription'
import { getUserData, getWebsiteKnowledge } from '@/utils/turso'
import { getUserVectorStoreDocuments } from '@/utils/vector-store-helpers'

export async function GET() {
  try {
    const { userId, has } = await auth()

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch documents, crawl record, and user data in parallel
    const [rawDocuments, wk, userData] = await Promise.all([
      getUserVectorStoreDocuments(userId),
      getWebsiteKnowledge(userId),
      getUserData(userId),
    ])

    if (rawDocuments === null) {
      return Response.json(
        { error: 'No vector store found for user' },
        { status: 404 }
      )
    }

    // Exclude crawl file from document list and quota calculations
    const crawlFileId = wk?.vectorStoreFileId ?? null
    const documents = rawDocuments
      .filter((doc) => doc.id !== crawlFileId)
      .sort((a, b) => b.createdAt - a.createdAt)

    // Determine if user has an eligible plan (paid or matching trial)
    const isSubscribed = await hasAnyPlan(has, 'basic', userId)

    // Allowed file count from database
    const filesLimit = userData?.documentCount ?? 0

    // Total storage limit from database
    const totalStorageLimit = userData?.totalStorageLimit ?? 0

    return Response.json({
      success: true,
      documents,
      totalDocuments: documents.length,
      filesLimit,
      isSubscribed,
      totalStorageLimit,
    })
  } catch (error) {
    console.error('Error retrieving documents from vector store:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
