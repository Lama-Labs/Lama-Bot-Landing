import type { WebhookEvent } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'

import { deleteUser, upsertUser } from '@/utils/turso'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_USER_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error(
      'Please add CLERK_USER_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local'
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

  // Handle user.deleted - remove user from database
  if (eventType === 'user.deleted') {
    const { id } = evt.data

    if (id) {
      console.log(`[user.deleted] Deleting user from database: ${id}`)
      await deleteUser(id)
      console.log(`[user.deleted] User deleted successfully: ${id}`)
    }

    return new Response('User deleted', { status: 200 })
  }

  return new Response('Webhook received', { status: 200 })
}
