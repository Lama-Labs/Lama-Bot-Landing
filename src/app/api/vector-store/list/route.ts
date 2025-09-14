import { auth, currentUser } from '@clerk/nextjs/server'

import { hasAnyPlan } from '@/utils/clerk/subscription'
import { getUserVectorStoreDocuments } from '@/utils/vector-store-helpers'

export async function GET() {
  try {
    const { userId, has } = await auth()

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all documents from user's vector store and sort by createdAt desc
    const documents = (await getUserVectorStoreDocuments(userId)).sort(
      (a, b) => b.createdAt - a.createdAt
    )

    if (documents === null) {
      return Response.json(
        { error: 'No vector store found for user' },
        { status: 404 }
      )
    }

    const user = await currentUser()

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Determine if user has an eligible plan (paid or matching trial)
    const isSubscribed = hasAnyPlan(has, 'basic', user.publicMetadata)

    // Allowed file count from Clerk public metadata
    const filesLimit = user.publicMetadata?.filesLimit ?? 0

    // Total storage limit from Clerk public metadata
    const totalStorageLimit = user.publicMetadata?.totalStorageLimit ?? 0

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
