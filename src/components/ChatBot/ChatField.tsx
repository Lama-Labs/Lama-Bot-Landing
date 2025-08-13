'use client'

import { readStreamableValue } from '@ai-sdk/rsc'
import { Box, IconButton } from '@mui/material'
import { Trash } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import React, { useEffect, useRef, useState } from 'react'

import { submitChatMessage } from '@/app/actions/chat'
import ChatInput from '@/components/ChatBot/ChatInput'
import ExampleAssistantMessageBubble from '@/components/ChatBot/ExampleAssistantMessageBubble'
import MessageBubble from '@/components/ChatBot/MessageBubble'
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

// Define the message type
interface Message {
  text: string
  isUser: boolean
}

const ChatField: React.FC = () => {
  const t = useTranslations('chat')
  const lang = useLocale()

  const [responses, setResponses] = useState<Message[]>([])
  const [question, setQuestion] = useState<string>('')
  const [isBusy, setIsBusy] = useState<boolean>(false)
  const [assistantId, setAssistantId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const handleSend = async () => {
    if (!question.trim()) return

    setIsBusy(true)

    // push the user message
    setResponses((prev) => [...prev, { text: question, isUser: true }])
    const sent = question
    setQuestion('')

    try {
      const threadId = await getThreadId()

      // add a placeholder assistant message
      const responseEntry: Message = { text: '', isUser: false }
      setResponses((prev) => [...prev, responseEntry])

      // Build and persist conversation with the new user turn
      const conversation: ChatTurn[] = appendConversationTurn({
        role: 'user',
        content: `[${lang}] ${sent}`,
      })

      // Refresh assistant cookie TTL on interaction
      if (assistantId) {
        setAssistantIdCookie(assistantId)
      }

      // Call the streaming server action with full conversation
      const { text } = await submitChatMessage({
        threadId,
        message: sent,
        assistantId,
        lang,
        conversation,
      })

      // Read the stream and progressively update the last assistant message
      for await (const full of readStreamableValue<string>(text)) {
        responseEntry.text = full ?? ''
        // trigger re-render
        setResponses((prev) => [...prev])
      }

      // Persist assistant turn when streaming finishes
      const updated: ChatTurn[] = [
        ...getConversation(),
        {
          role: 'assistant',
          content: responseEntry.text,
        },
      ]
      setConversation(updated)
    } catch (error) {
      console.error('Error fetching from API:', error)
      setResponses((prev) => [
        ...prev,
        { text: t('errorMessage'), isUser: false },
      ])
    } finally {
      setIsBusy(false)
    }
  }

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [responses])

  useEffect(() => {
    const init = async () => {
      try {
        const assistantIdCookie = getAssistantId()
        const responsesToSet: Message[] = []

        // Always restore existing conversation, regardless of assistant selection
        const conv = getConversation()
        for (const turn of conv) {
          responsesToSet.push({
            text: turn.content,
            isUser: turn.role === 'user',
          })
        }

        if (assistantIdCookie) {
          setAssistantId(assistantIdCookie)
          // Show initial assistant message only if starting fresh
          if (!hasActiveThread() && conv.length === 0) {
            const initialText = t
              .raw('initialAssistants')
              .find(
                (assistant: { id: string }) =>
                  assistant.id === assistantIdCookie
              )?.initialMessage
            if (initialText) {
              responsesToSet.push({ text: initialText, isUser: false })
            }
          }
        }

        setResponses(responsesToSet)
      } catch (error) {
        console.error('Error initializing chat:', error)
      }
    }
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
    init()
  }, [t])

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 90,
        right: 16,
        width: '22em',
        height: '30em',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 3,
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'chat.background',
      }}
    >
      {/* Clear button */}
      <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
        <IconButton
          onClick={() => {
            clearThreadId()
            clearAssistantIdCookie()
            clearConversation()
            setResponses([])
            setAssistantId(null)
          }}
          sx={{
            color: 'chat.scrollbarThumb',
            '&:hover': {
              color: 'primary.main',
            },
          }}
        >
          <Trash size={20} />
        </IconButton>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          padding: 2,
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
        {/* show initial assistant selector */}
        {!assistantId && (
          <ExampleAssistantMessageBubble
            setAssistantId={setAssistantId}
            setResponses={setResponses}
          />
        )}

        {/* show assistant messages */}
        {responses.map((msg, index) => (
          <MessageBubble key={index} message={msg.text} isUser={msg.isUser} />
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

export default ChatField
