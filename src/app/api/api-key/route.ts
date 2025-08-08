import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  console.log('=== API KEY RETRIEVAL REQUEST ===')
  console.log('Timestamp:', new Date().toISOString())
  try {
    // Get the authenticated user's ID
    const { userId, has } = await auth()

    // Protect the route by checking if the user is signed in
    if (!userId) {
      console.log('Unauthorized request - no user ID')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check if the user is a paid user
    const hasSubscription = has({ plan: 'basic' })
    if (!hasSubscription) {
      console.log('User is not a paid user')
      return new NextResponse('User is not a paid user', { status: 403 })
    }

    // Get the current user to access public metadata
    const user = await currentUser()
    console.log('User email:', user?.emailAddresses?.[0]?.emailAddress)

    if (!user) {
      console.log('User not found in database')
      return new NextResponse('User not found', { status: 404 })
    }

    // Get the API key from public metadata (now stored by webhook)
    const apiKey = user.publicMetadata?.apiKey as string | undefined

    if (!apiKey) {
      console.log('No API key found for user')
      return NextResponse.json(
        {
          message: 'No API key found. Please generate one first.',
          apiKey: null,
        },
        { status: 404 }
      )
    }

    console.log('API key retrieved successfully')
    return NextResponse.json(
      {
        message: 'API key retrieved successfully',
        apiKey: apiKey,
        createdAt: user.publicMetadata?.apiKeyCreatedAt as string | undefined,
        subscriptionPlan: user.publicMetadata?.subscriptionPlan as
          | string
          | undefined,
        subscriptionStatus: user.publicMetadata?.subscriptionStatus as
          | string
          | undefined,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('=== API KEY RETRIEVAL ERROR ===')
    console.error('Error retrieving API key:', error)
    console.error('=== END ERROR LOG ===')
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
