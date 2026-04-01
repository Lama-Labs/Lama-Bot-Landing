import crypto from 'crypto'

import { verifyWebhook } from '@clerk/nextjs/webhooks'
import type { NextRequest } from 'next/server'

import { getClerkUser } from '@/utils/clerk/users'
import { openaiClient } from '@/utils/openai-client'
import { PLANS, getPlanLimits } from '@/utils/plans'
import { deleteFileFromR2 } from '@/utils/r2-helpers'
import { getUserData, getWebsiteKnowledge, upsertUser } from '@/utils/turso'
import {
  deleteFileFromVectorStore,
  getUserVectorStoreDocuments,
} from '@/utils/vector-store-helpers'

export async function POST(req: NextRequest) {
  let evt
  try {
    evt = await verifyWebhook(req, {
      signingSecret: process.env.CLERK_SUBSCRIPTION_WEBHOOK_SECRET,
    })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occurred', { status: 400 })
  }

  const { id } = evt.data
  const eventType = evt.type

  console.log(`Webhook with an ID of ${id} and type of ${eventType}`)

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

          // Get existing user data from DB (user should already exist from user.created webhook)
          // Also get Clerk user for email as fallback
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
            const limits = getPlanLimits(planSlug)

            // Handle downgrade: delete uploaded documents when switching to basic
            // Only runs when the user has a vector store (i.e., was previously provisioned)
            if (
              eventType === 'subscription.updated' &&
              planSlug === PLANS.BASIC &&
              existingVectorStoreId
            ) {
              try {
                const [allDocs, wk] = await Promise.all([
                  getUserVectorStoreDocuments(userId),
                  getWebsiteKnowledge(userId),
                ])
                const crawlFileId = wk?.vectorStoreFileId ?? null
                const uploadedDocs = (allDocs ?? []).filter(
                  (doc) => doc.id !== crawlFileId
                )

                if (uploadedDocs.length > 0) {
                  console.log(
                    `[webhook] Downgrade detected for ${userId}: deleting ${uploadedDocs.length} uploaded file(s)`
                  )
                  await Promise.allSettled(
                    uploadedDocs.map(async (doc) => {
                      await deleteFileFromVectorStore(userId, doc.id)
                      deleteFileFromR2(userId, doc.id).catch((err) =>
                        console.error(
                          `[webhook] Failed to delete R2 file ${doc.id}:`,
                          err
                        )
                      )
                    })
                  )
                }
              } catch (downgradeError) {
                console.error(
                  '[webhook] Failed to delete files on downgrade:',
                  downgradeError
                )
              }
            }

            // Update user with subscription-specific data (api key, vector store, limits)
            // Uses upsert as fallback in case user.created webhook failed
            await upsertUser({
              clerkUserId: userId,
              email,
              apiKey,
              vectorStoreId,
              documentCount: limits.documentCount,
              totalStorageLimit: limits.totalStorageLimit,
              crawlEnabled: limits.crawlEnabled,
              crawlMaxPages: limits.crawlMaxPages,
              crawlCooldownDays: limits.crawlCooldownDays,
            })

            console.log(
              `User subscription data saved to database for user: ${userId}`
            )
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
