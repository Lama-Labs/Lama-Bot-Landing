'use client'

import { readStreamableValue } from '@ai-sdk/rsc'
import { Box } from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'
import { Fragment, useEffect, useRef, useState } from 'react'

import { submitChatMessage } from '@/app/actions/chat'
import ChatHeader from '@/components/ChatBot/ChatHeader'
import ChatInput from '@/components/ChatBot/ChatInput'
import ExampleAssistantMessageBubble from '@/components/ChatBot/ExampleAssistantMessageBubble'
import MessageBubble from '@/components/ChatBot/MessageBubble'
import SuggestionChips from '@/components/ChatBot/SuggestionChips'
import { useChat } from '@/context/ChatContext'
import {
  appendConversationTurn,
  clearAssistantId as clearAssistantIdCookie,
  clearConversation,
  clearThreadId,
  getAssistantId,
  getConversation,
  getThreadId,
  hasActiveThread,
  setAssistantId as setAssistantIdCookie,
  setConversation,
} from '@/utils/CookieHelpers'
import type { ChatTurn } from '@/utils/CookieHelpers'

// Define the message type
interface Message {
  text: string
  isUser: boolean
  suggestions?: string[]
}

interface ChatWindowProps {
  embedded?: boolean
  mode?: 'demo' | 'dashboard'
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  embedded = false,
  mode = 'demo',
}) => {
  const t = useTranslations('chat')
  const lang = useLocale()

  // Derive cookie namespace from mode
  const cookieNamespace = mode === 'dashboard' ? 'dashboard_' : ''

  const [responses, setResponses] = useState<Message[]>([])
  const [question, setQuestion] = useState<string>('')
  const [isBusy, setIsBusy] = useState<boolean>(false)
  const [assistantId, setAssistantId] = useState<string | null>(null)
  const { assistantName, setAssistantName } = useChat()
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)

  const handleSend = async (override?: string) => {
    const toSend = (override ?? question).trim()
    if (!toSend) return

    setIsBusy(true)

    // push the user message
    setResponses((prev) => [...prev, { text: toSend, isUser: true }])
    const sent = toSend
    setQuestion('')

    // Add a placeholder assistant message for loading state
    const responseEntry: Message = { text: '', isUser: false }
    setResponses((prev) => [...prev, responseEntry])

    try {
      const threadId = await getThreadId(cookieNamespace)

      // Build and persist conversation with the new user turn
      const conversation: ChatTurn[] = appendConversationTurn(
        {
          role: 'user',
          content: `[${lang}] ${sent}`,
        },
        cookieNamespace
      )

      // Refresh assistant cookie TTL on interaction (demo mode only)
      if (assistantId && mode === 'demo') {
        setAssistantIdCookie(assistantId, cookieNamespace)
      }

      // Call the streaming server action with full conversation
      const { text } = await submitChatMessage({
        threadId,
        message: sent,
        assistantId,
        lang,
        conversation,
        useDashboardMode: mode === 'dashboard',
      })

      // Read the stream and progressively update the last assistant message
      for await (const full of readStreamableValue<string>(text)) {
        responseEntry.text = full ?? ''
        // trigger re-render
        setResponses((prev) => [...prev])
      }

      // Persist assistant turn when streaming finishes
      const updated: ChatTurn[] = [
        ...getConversation(cookieNamespace),
        {
          role: 'assistant',
          content: responseEntry.text,
        },
      ]
      setConversation(updated, cookieNamespace)
    } catch (error) {
      console.error('Error fetching from API:', error)
      // Update the placeholder message with error text instead of adding a new one
      responseEntry.text = t('errorMessage')
      setResponses((prev) => [...prev])
    } finally {
      setIsBusy(false)
    }
  }

  // Auto-scroll to the latest message
  useEffect(() => {
    if (embedded) {
      const container = messagesContainerRef.current
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [responses, embedded])

  useEffect(() => {
    const init = async () => {
      try {
        const responsesToSet: Message[] = []

        // Always restore existing conversation
        const conv = getConversation(cookieNamespace)

        if (mode === 'dashboard') {
          // Dashboard mode: no assistant selector, use user's assistant
          setAssistantId('dashboard')
          setAssistantName(t('dashboard.assistantName'))

          // Restore conversation
          for (const turn of conv) {
            responsesToSet.push({
              text: turn.content,
              isUser: turn.role === 'user',
            })
          }

          // Show initial dashboard message only if starting fresh
          if (!hasActiveThread(cookieNamespace) && conv.length === 0) {
            responsesToSet.push({
              text: t('dashboard.initialMessage'),
              isUser: false,
            })
          }
        } else {
          // Demo mode: original logic with assistant selector
          const assistantIdCookie = getAssistantId(cookieNamespace)

          // Get selected assistant info for attaching suggestions
          const selectedAssistant = assistantIdCookie
            ? (t
                .raw('initialAssistants')
                .find(
                  (assistant: { id: string }) =>
                    assistant.id === assistantIdCookie
                ) as
                | {
                    initialMessage?: string
                    suggestions?: string[]
                    name?: string
                  }
                | undefined)
            : undefined

          for (const turn of conv) {
            const message: Message = {
              text: turn.content,
              isUser: turn.role === 'user',
            }

            // Attach suggestions to the initial assistant message if it matches
            if (
              !message.isUser &&
              selectedAssistant?.initialMessage === turn.content &&
              selectedAssistant.suggestions
            ) {
              message.suggestions = selectedAssistant.suggestions
            }

            responsesToSet.push(message)
          }

          if (assistantIdCookie) {
            setAssistantId(assistantIdCookie)

            // Show initial assistant message only if starting fresh
            if (
              !hasActiveThread(cookieNamespace) &&
              conv.length === 0 &&
              selectedAssistant?.initialMessage
            ) {
              responsesToSet.push({
                text: selectedAssistant.initialMessage,
                isUser: false,
                suggestions: selectedAssistant.suggestions,
              })
            }

            // Set header title based on restored assistant
            if (selectedAssistant?.name)
              setAssistantName(selectedAssistant.name)
          }
        }

        setResponses(responsesToSet)
      } catch (error) {
        console.error('Error initializing chat:', error)
      }
    }
    // run once
    init()
  }, [t, setAssistantName, mode, cookieNamespace])

  return (
    <Box
      sx={{
        position: embedded ? 'relative' : 'fixed',
        bottom: embedded ? undefined : 90,
        right: embedded ? undefined : 16,
        width: embedded ? '100%' : '22em',
        height: embedded ? '100%' : '30em',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1)',
        borderRadius: 4,
        overflow: 'hidden',
        bgcolor: 'chat.background',
        zIndex: 999,
      }}
    >
      {/* Header */}
      <ChatHeader
        onReset={() => {
          clearThreadId(cookieNamespace)
          clearAssistantIdCookie(cookieNamespace)
          clearConversation(cookieNamespace)

          if (mode === 'dashboard') {
            setAssistantId('dashboard')
            setAssistantName(t('dashboard.assistantName'))
            // Show initial message after reset in dashboard mode
            setResponses([
              {
                text: t('dashboard.initialMessage'),
                isUser: false,
              },
            ])
          } else {
            setAssistantId(null)
            setAssistantName('Alpaca Chat')
            setResponses([])
          }
        }}
        title={assistantName}
        icon='/alpaca logo.svg'
      />

      {/* Messages */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          padding: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          bgcolor: 'chat.background',

          /* Custom Scrollbar Styles */
          '&::-webkit-scrollbar': {
            width: '8px', // Width of the scrollbar
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'chat.scrollbarTrack', // Background color of the scrollbar track
            borderRadius: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'chat.scrollbarThumb', // Color of the scrollbar thumb
            borderRadius: '8px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'primary.dark', // Color of the scrollbar thumb on hover
            cursor: 'default',
          },
        }}
      >
        {/* show initial assistant selector (demo mode only) */}
        {mode === 'demo' && !assistantId && (
          <ExampleAssistantMessageBubble
            setAssistantId={setAssistantId}
            setResponses={setResponses}
            namespace=''
          />
        )}

        {/* show assistant messages */}
        {responses.map((msg, index) => (
          <Fragment key={index}>
            <MessageBubble message={msg.text} isUser={msg.isUser} />
            {!msg.isUser && msg.suggestions && msg.suggestions.length > 0 && (
              <SuggestionChips
                suggestions={msg.suggestions}
                onSelect={(text) => handleSend(text)}
                disabled={isBusy}
              />
            )}
          </Fragment>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Field */}
      <ChatInput
        newQuestion={question}
        setNewQuestion={setQuestion}
        handleSend={handleSend}
        disabled={isBusy}
      />
    </Box>
  )
}

export default ChatWindow
