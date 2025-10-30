import Cookies from 'js-cookie'

export type ChatTurn = { role: 'user' | 'assistant'; content: string }

// Thread helpers
export const getThreadId = async (namespace: string = ''): Promise<string> => {
  const cookieKey = `${namespace}thread_id`
  let threadId = Cookies.get(cookieKey)
  if (!threadId) {
    threadId = `thread_${Math.random().toString(36).slice(2)}_${Date.now()}`
  }
  Cookies.set(cookieKey, threadId, { expires: 1 })
  return threadId
}

export const readThreadId = (namespace: string = ''): string | null => {
  const cookieKey = `${namespace}thread_id`
  return Cookies.get(cookieKey) ?? null
}

export const hasActiveThread = (namespace: string = ''): boolean => {
  return readThreadId(namespace) !== null
}

export const clearThreadId = (namespace: string = ''): void => {
  const cookieKey = `${namespace}thread_id`
  Cookies.remove(cookieKey)
}

// Assistant helpers
export const getAssistantId = (namespace: string = ''): string | null => {
  const cookieKey = `${namespace}assistant_id`
  return Cookies.get(cookieKey) ?? null
}

export const setAssistantId = (
  assistantId: string,
  namespace: string = ''
): void => {
  const cookieKey = `${namespace}assistant_id`
  Cookies.set(cookieKey, assistantId, { expires: 1 })
}

export const clearAssistantId = (namespace: string = ''): void => {
  const cookieKey = `${namespace}assistant_id`
  Cookies.remove(cookieKey)
}

// Conversation helpers
export function getConversation(namespace: string = ''): ChatTurn[] {
  const cookieKey = `${namespace}conversation`
  const raw = Cookies.get(cookieKey)
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

export function setConversation(
  turns: ChatTurn[],
  namespace: string = ''
): void {
  const cookieKey = `${namespace}conversation`
  Cookies.set(cookieKey, JSON.stringify(turns), { expires: 1 })
}

export function appendConversationTurn(
  turn: ChatTurn,
  namespace: string = ''
): ChatTurn[] {
  const current = getConversation(namespace)
  const updated = [...current, turn]
  setConversation(updated, namespace)
  return updated
}

export function clearConversation(namespace: string = ''): void {
  const cookieKey = `${namespace}conversation`
  Cookies.remove(cookieKey)
}
