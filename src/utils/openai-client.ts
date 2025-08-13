import { createOpenAI } from '@ai-sdk/openai'
import OpenAI from 'openai'

export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const openaiVercelClient = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})
