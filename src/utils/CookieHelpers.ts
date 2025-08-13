import Cookies from 'js-cookie'

export type ChatTurn = { role: 'user' | 'assistant'; content: string }

const THREAD_COOKIE_KEY = 'thread_id'
const ASSISTANT_COOKIE_KEY = 'assistant_id'
const CONVERSATION_COOKIE_KEY = 'conversation'

// Thread helpers
export const getThreadId = async (): Promise<string> => {
  let threadId = Cookies.get(THREAD_COOKIE_KEY)
  if (!threadId) {
    threadId = `thread_${Math.random().toString(36).slice(2)}_${Date.now()}`
  }
  Cookies.set(THREAD_COOKIE_KEY, threadId, { expires: 1 })
  return threadId
}

export const readThreadId = (): string | null => {
  return Cookies.get(THREAD_COOKIE_KEY) ?? null
}

export const hasActiveThread = (): boolean => {
  return readThreadId() !== null
}

export const clearThreadId = (): void => {
  Cookies.remove(THREAD_COOKIE_KEY)
}

// Assistant helpers
export const getAssistantId = (): string | null => {
  return Cookies.get(ASSISTANT_COOKIE_KEY) ?? null
}

export const setAssistantId = (assistantId: string): void => {
  Cookies.set(ASSISTANT_COOKIE_KEY, assistantId, { expires: 1 })
}

export const clearAssistantId = (): void => {
  Cookies.remove(ASSISTANT_COOKIE_KEY)
}

// Conversation helpers
export function getConversation(): ChatTurn[] {
  const raw = Cookies.get(CONVERSATION_COOKIE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (t: { role: string; content: string | undefined }) =>
          (t.role === 'user' || t.role === 'assistant') &&
          typeof t.content === 'string'
      )
    }
  } catch {}
  return []
}

export function setConversation(turns: ChatTurn[]): void {
  Cookies.set(CONVERSATION_COOKIE_KEY, JSON.stringify(turns), { expires: 1 })
}

export function appendConversationTurn(turn: ChatTurn): ChatTurn[] {
  const current = getConversation()
  const updated = [...current, turn]
  setConversation(updated)
  return updated
}

export function clearConversation(): void {
  Cookies.remove(CONVERSATION_COOKIE_KEY)
}
