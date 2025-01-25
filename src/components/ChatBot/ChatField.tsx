'use client'

import { Box, IconButton } from '@mui/material'
import Cookies from 'js-cookie'
import { Trash } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import {
  MessageContent,
  Message as OpenAiMessage,
  TextContentBlock,
} from 'openai/resources/beta/threads/messages'
import React, { useEffect, useRef, useState } from 'react'

import ChatInput from '@/components/ChatBot/ChatInput'
import ExampleAssistantMessageBubble from '@/components/ChatBot/ExampleAssistantMessageBubble'
import MessageBubble from '@/components/ChatBot/MessageBubble'
import { getThreadId, getThreadMessages } from '@/utils/OpenAiHelpers'

// Define message type
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
    setIsBusy(true)

    // const pageContent = document.body.innerText TODO reimplement
    setResponses([...responses, { text: question, isUser: true }])
    setQuestion('')

    try {
      const threadId = await getThreadId()

      // Proceed with sending the message
      const messageResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/chatWindow/message/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question, threadId, lang }),
        }
      )

      if (!messageResponse.body) {
        throw new Error('Message is null')
      }

      // Add an empty entry for the incoming API response
      const responseEntry = { text: '', isUser: false }
      setResponses((prevResponses) => [...prevResponses, responseEntry])

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/chatWindow/run/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ threadId, assId: assistantId }),
        }
      )

      if (!response.body) {
        throw new Error('Response body is null')
      }

      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader()

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        // Process each SSE message
        const eventMessage = value.trim()
        eventMessage
          .replaceAll('}{', '};{')
          .split(';')
          .forEach((msg) => {
            const eventData = JSON.parse(msg)

            // Handle different event types
            switch (eventData.type) {
              case 'textDelta':
                responseEntry.text += eventData.text
                break
              // case 'toolCallCreated':
              //   responseEntry.text += `\nTool Call: ${eventData.toolCall.type}\n`;
              //   break;
              // case 'codeInterpreterInput':
              //   responseEntry.text += `\nCode Input: ${eventData.input}\n`;
              //   break;
              // case 'codeInterpreterOutputs':
              //   responseEntry.text += `\nCode Output: ${eventData.outputs
              //     .map((output) => (output.type === 'logs' ? output.logs : ''))
              //     .join('\n')}\n`;
              //   break;
              default:
                console.warn('Unhandled event type:', eventData.type)
            }

            // Update the state with the new response content
            setResponses((prevResponses) => [...prevResponses])
          })
      }
    } catch (error) {
      console.error('Error fetching from API:', error)
      setResponses((prevResponses) => [
        ...prevResponses,
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
    const fetchMessages = async () => {
      try {
        const assistantId = Cookies.get('assistant_id')
        const responsesToSet: Message[] = []
        if (assistantId) {
          setAssistantId(assistantId)
          const initialText = t
            .raw('initialAssistants')
            .find(
              (assistant: { id: string }) => assistant.id === assistantId
            )?.initialMessage
          responsesToSet.push({ text: initialText, isUser: false })
        }

        const threadId = Cookies.get('thread_id')
        if (threadId) {
          const threadMessages = await getThreadMessages(threadId)
          if (Array.isArray(threadMessages)) {
            // Process the valid messages
            const messages = threadMessages.map((msg: OpenAiMessage) => ({
              text: msg.content
                .filter((content: MessageContent) => content.type === 'text')
                .map((content: TextContentBlock) => content.text?.value)
                .join(' '),
              isUser: msg.role === 'user',
            }))
            responsesToSet.push(...messages)
          }
        }
        setResponses(responsesToSet)
      } catch (error) {
        console.error('Error fetching messages from API:', error)
      }
    }
    fetchMessages()
  }, []) //eslint-disable-line
  // disabled eslint because we only want to run this once

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
      {/* Delete button */}
      <Box
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
        }}
      >
        <IconButton
          onClick={() => {
            Cookies.remove('thread_id')
            Cookies.remove('assistant_id')
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

      {/* Messages Display */}
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
