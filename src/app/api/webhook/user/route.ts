import { verifyWebhook } from '@clerk/nextjs/webhooks'
import type { NextRequest } from 'next/server'

import { deleteAllUserFilesFromR2 } from '@/utils/r2-helpers'
import { deleteUser, upsertUser } from '@/utils/turso'

export async function POST(req: NextRequest) {
  let evt
  try {
    evt = await verifyWebhook(req, {
      signingSecret: process.env.CLERK_USER_WEBHOOK_SECRET,
    })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occurred', { status: 400 })
  }

  const eventType = evt.type

  // Handle user.created - create user in database
  if (eventType === 'user.created') {
    const { id, email_addresses, primary_email_address_id } = evt.data

    // Get primary email
    const primaryEmail = email_addresses?.find(
      (email) => email.id === primary_email_address_id
    )?.email_address

    console.log(`[user.created] Creating user in database: ${id}`)

    await upsertUser({
      clerkUserId: id,
      email: primaryEmail ?? null,
    })

    console.log(`[user.created] User created successfully: ${id}`)
    return new Response('User created', { status: 200 })
  }

  // Handle user.updated - only update email (other fields can't be changed by user)
  if (eventType === 'user.updated') {
    const { id, email_addresses, primary_email_address_id } = evt.data

    // Get primary email
    const primaryEmail = email_addresses?.find(
      (email) => email.id === primary_email_address_id
    )?.email_address

    console.log(`[user.updated] Updating user email in database: ${id}`)

    await upsertUser({
      clerkUserId: id,
      email: primaryEmail ?? null,
    })

    console.log(`[user.updated] User email updated successfully: ${id}`)
    return new Response('User updated', { status: 200 })
  }

  // Handle user.deleted - remove user from database and clean up R2 backups
  if (eventType === 'user.deleted') {
    const { id } = evt.data

    if (id) {
      console.log(`[user.deleted] Deleting user from database: ${id}`)
      await deleteUser(id)
      console.log(`[user.deleted] User deleted successfully: ${id}`)

      // Clean up all R2 backup files for this user
      console.log(`[user.deleted] Cleaning up R2 backups for user: ${id}`)
      await deleteAllUserFilesFromR2(id)
    }

    return new Response('User deleted', { status: 200 })
  }

  return new Response('Webhook received', { status: 200 })
}
