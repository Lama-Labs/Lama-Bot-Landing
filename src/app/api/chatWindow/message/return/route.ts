import { NextRequest } from 'next/server'
import OpenAI from 'openai'

export async function GET(req: NextRequest) {
  const openai = new OpenAI()

  const { searchParams } = new URL(req.url)
  const threadId = searchParams.get('threadId')

  if (!threadId)
    return Response.json({ error: 'Invalid threadId' }, { status: 400 })

  try {
    const threadMessages = await openai.beta.threads.messages.list(threadId, {
      order: 'asc',
    })

    return Response.json(threadMessages.data)
  } catch (e) {
    console.error(e)
    return Response.json({ error: e })
  }
}
