import { NextRequest } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  const { question, threadId, lang } = await req.json()
  const message = `[${lang}] ${question}`

  if (!threadId || !message)
    return Response.json({ error: 'Invalid message' }, { status: 400 })

  const openai = new OpenAI()

  try {
    const threadMessage = await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message,
    })

    return Response.json(threadMessage)
  } catch (e) {
    console.error(e)
    return Response.json({ error: e })
  }
}
