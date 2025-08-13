import crypto from 'crypto'

import type { WebhookEvent } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'

import {
  getClerkUser,
  mergeUserPrivateMetadata,
  mergeUserPublicMetadata,
} from '@/utils/clerk/users'
import { openaiClient } from '@/utils/openai-client'

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subscriptionData = evt.data as any

      // Check if this is a subscription with paid items
      if (subscriptionData.items && Array.isArray(subscriptionData.items)) {
        const activePaidItems = subscriptionData.items.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item: any) =>
            item.status === 'active' && item.plan && item.plan.amount > 0
        )

        if (activePaidItems.length > 0 && subscriptionData.payer?.user_id) {
          const userId = subscriptionData.payer.user_id
          console.log(`Processing subscription for user: ${userId}`)

          // Get the user from Clerk
          const user = await getClerkUser(userId)

          if (user) {
            // Check if API key and vector store ID already exist in public metadata
            const existingApiKey = user.publicMetadata?.apiKey as
              | string
              | undefined
            const existingVectorStoreId = user.privateMetadata
              ?.vectorStoreId as string | undefined

            if (!existingApiKey) {
              // Generate a secure API key
              const apiKey = `lama-${crypto.randomBytes(32).toString('hex')}`

              // Store the API key and vector store ID in Clerk's metadata
              await mergeUserPublicMetadata(userId, {
                apiKey: apiKey,
                apiKeyCreatedAt: new Date().toISOString(),
                subscriptionPlan: activePaidItems[0].plan.slug,
                subscriptionStatus: 'active',
              })

              console.log(`API key generated and saved for user: ${userId}`)
              console.log(`Subscription plan: ${activePaidItems[0].plan.slug}`)
            } else {
              // Update subscription info even if API key exists
              await mergeUserPublicMetadata(userId, {
                subscriptionPlan: activePaidItems[0].plan.slug,
                subscriptionStatus: 'active',
              })

              console.log(
                `Subscription updated for user: ${userId} (API key already exists)`
              )
            }

            if (!existingVectorStoreId) {
              // Create vector store for the user
              let vectorStoreId: string | undefined
              try {
                const vectorStoreName = `${userId}-vector-store`
                const vectorStore = await openaiClient.vectorStores.create({
                  name: vectorStoreName,
                })
                vectorStoreId = vectorStore.id
                await mergeUserPrivateMetadata(userId, {
                  vectorStoreId: vectorStoreId,
                })
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
