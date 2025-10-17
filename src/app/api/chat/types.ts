export type ChatRequestBody = {
  sessionId: string
  websiteContent: string
  userMessage: string
  conversation: { role: 'user' | 'assistant'; content: string }[]
  language: string
}
