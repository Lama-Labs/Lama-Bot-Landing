import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { hasAnyPlan } from '@/utils/clerk/subscription'
import { getUserData } from '@/utils/turso'

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

    // Check if the user is eligible via trial tier or paid plan
    const hasSubscription = await hasAnyPlan(has, 'basic', userId)
    if (!hasSubscription) {
      console.log('User is not a paid user')
      return new NextResponse('User is not a paid user', { status: 403 })
    }

    // Get the API key from database
    const userData = await getUserData(userId)
    const apiKey = userData?.apiKey

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
