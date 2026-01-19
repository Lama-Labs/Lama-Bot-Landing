import crypto from 'crypto'

import type { WebhookEvent } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'

import { getClerkUser } from '@/utils/clerk/users'
import { openaiClient } from '@/utils/openai-client'
import { getUserData, upsertUser } from '@/utils/turso'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error(
      'Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local'
    )
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occurred', {
      status: 400,
    })
  }

  const { id } = evt.data
  const eventType = evt.type

  console.log(`Webhook with an ID of ${id} and type of ${eventType}`)
  console.log('Webhook body:', body)
  console.log('Webhook event data:', evt.data)
  console.log('Webhook event type:', evt.type)
  console.log('Webhook headers:', {
    'svix-id': svix_id,
    'svix-timestamp': svix_timestamp,
    'svix-signature': svix_signature,
  })

  // Log all webhook data for debugging purposes
  console.log('=== WEBHOOK DATA LOG ===')
  console.log('Event Type:', eventType)
  console.log('Event ID:', id)
  console.log('Full Event Data:', JSON.stringify(evt.data, null, 2))
  console.log('=== END WEBHOOK DATA LOG ===')

  // Handle subscription events
  if (
    eventType === 'subscription.updated' ||
    eventType === 'subscription.created'
  ) {
    try {
      const subscriptionData = evt.data

      // Check if this is a subscription with paid items
      if (subscriptionData.items && Array.isArray(subscriptionData.items)) {
        const activePaidItems = subscriptionData.items.filter(
          (item) =>
            item.status === 'active' && item.plan && item.plan.amount > 0
        )

        if (activePaidItems.length > 0 && subscriptionData.payer?.user_id) {
          const userId = subscriptionData.payer.user_id
          console.log(`Processing subscription for user: ${userId}`)

          // Get the user from Clerk (for email) and existing data from DB
          const [clerkUser, existingUserData] = await Promise.all([
            getClerkUser(userId),
            getUserData(userId),
          ])

          if (clerkUser) {
            const email = clerkUser.emailAddresses[0]?.emailAddress ?? null
            const existingApiKey = existingUserData?.apiKey
            const existingVectorStoreId = existingUserData?.vectorStoreId

            const planSlug = activePaidItems[0].plan?.slug ?? 'basic'

            // Generate API key if doesn't exist
            let apiKey = existingApiKey
            if (!apiKey) {
              apiKey = `lama-${crypto.randomBytes(32).toString('hex')}`
              console.log(`API key generated for user: ${userId}`)
              console.log(`Subscription plan: ${planSlug}`)
            } else {
              console.log(
                `Subscription updated for user: ${userId} (API key already exists)`
              )
            }

            // Create vector store if doesn't exist
            let vectorStoreId = existingVectorStoreId
            if (!vectorStoreId) {
              try {
                const vectorStoreName = `${userId}-vector-store`
                const vectorStore = await openaiClient.vectorStores.create({
                  name: vectorStoreName,
                })
                vectorStoreId = vectorStore.id
                console.log(
                  `Vector store created for user ${userId}: ${vectorStoreId}`
                )
              } catch (vectorStoreError) {
                console.error(
                  `Error creating vector store for user ${userId}:`,
                  vectorStoreError
                )
                return new Response(
                  'Error occurred while creating vector store',
                  { status: 500 }
                )
              }
            }

            // Calculate limits based on plan
            const documentCount = planSlug === 'basic' ? 10 : 20
            const totalStorageLimit = documentCount * 1024 * 1024

            // Save all user data to database in one operation
            await upsertUser({
              clerkUserId: userId,
              email,
              apiKey,
              vectorStoreId,
              documentCount,
              totalStorageLimit,
            })

            console.log(`User data saved to database for user: ${userId}`)
          } else {
            console.error(`User not found: ${userId}`)
          }
        }
      }
    } catch (error) {
      console.error('=== SUBSCRIPTION PROCESSING ERROR ===')
      console.error('Error processing subscription webhook:', error)
      console.error('=== END ERROR LOG ===')
    }
  }

  return new Response('Webhook received successfully', { status: 200 })
}
