'use client'

import { Box } from '@mui/material'
import React, { useEffect, useRef, useState } from 'react'

import ChatInput from '@/components/ChatBot/ChatInput'
import MessageBubble from '@/components/ChatBot/MessageBubble'

// Define message type
interface Message {
  text: string
  isUser: boolean
}

const ChatField: React.FC = () => {
  const [responses, setResponses] = useState<Message[]>([
    { text: 'Hello! How can I help you today?', isUser: false },
  ])
  const [question, setQuestion] = useState<string>('')
  const [isBusy, setIsBusy] = useState<boolean>(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const handleSend = async () => {
    const pageContent = document.body.innerText
    setResponses([...responses, { text: question, isUser: true }])
    setQuestion('')

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/chatQuery`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question, pageContent }),
        }
      )

      if (!response.body) {
        throw new Error('Response body is null')
      }

      setIsBusy(true)
      // Add an empty entry for the incoming API response
      const responseEntry = { text: '', isUser: false }
      setResponses((prevResponses) => [...prevResponses, responseEntry])

      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader()

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        responseEntry.text += value
        setResponses((prevResponses) => [...prevResponses])
      }
    } catch (error) {
      console.error('Error fetching from API:', error)
      // setResponse('Error occurred while fetching the stream.')
    } finally {
      setIsBusy(false)
    }
  }

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [responses])

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
