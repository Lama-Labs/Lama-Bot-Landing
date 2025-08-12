import { NextRequest, NextResponse } from 'next/server'
import { getMessages } from 'next-intl/server'

export async function handleAssistantLogic(
  req: NextRequest,
  res: NextResponse
): Promise<void> {
  const url = new URL(req.url)
  const assistantId = url.searchParams.get('assistant_id')
  const locale = req.headers.get('x-next-intl-locale') || 'en'

  try {
    const messages = await getMessages({ locale })
    const isValidAssistant = (
      messages as { chat?: { initialAssistants?: { id: string }[] } }
    )?.chat?.initialAssistants?.some(
      (assistant) => assistant.id === assistantId
    )

    if (assistantId && isValidAssistant) {
      // Reset related chat cookies so the user can start directly with the selected assistant
      res.cookies.set('assistant_id', assistantId, {
        maxAge: 86400, // 1 day
        path: '/',
        sameSite: 'lax',
        secure: true,
      })
      res.cookies.set('thread_id', '', { maxAge: 0, path: '/' })
      res.cookies.set('conversation', '', { maxAge: 0, path: '/' })
      console.log('Middleware setting cookie:', res.cookies.get('assistant_id'))
    }
  } catch (error) {
    console.error('Error fetching locale messages:', error)
  }
}
