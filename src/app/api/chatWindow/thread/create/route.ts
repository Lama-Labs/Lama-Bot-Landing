import OpenAI from 'openai'

export async function POST() {
  const openai = new OpenAI()

  try {
    const thread = await openai.beta.threads.create()

    return Response.json(thread)
  } catch (e) {
    console.error(e)
    return Response.json({ error: e })
  }
}
