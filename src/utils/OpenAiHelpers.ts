import Cookies from 'js-cookie'

export const getThreadId = async () => {
  let threadId = Cookies.get('thread_id')

  if (threadId) {
    Cookies.set('thread_id', threadId, { expires: 1 }) // Reset TTL to 1 day
    return threadId
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/chatWindow/thread/create`,
    { method: 'POST' }
  )

  const data = await response.json()
  threadId = data.id

  if (!threadId) {
    throw new Error('Thread ID is null')
  }

  // Set the thread ID in a cookie
  Cookies.set('thread_id', threadId, { expires: 1 }) // 1 day TTL
  return threadId
}

export const getThreadMessages = async (threadId: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/chatWindow/message/return?threadId=${encodeURIComponent(threadId)}`,
    {
      method: 'GET',
    }
  )

  return await response.json()
}
