'use client'

import { Fab } from '@mui/material'
import { MessageCircle } from 'lucide-react'
import React, { useState } from 'react'

import ChatField from '@/components/ChatBot/ChatField'

const FloatingActionButton: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <>
      {isChatOpen && <ChatField />}
      <Fab
        color='primary'
        aria-label='open chat'
        onClick={() => setIsChatOpen(!isChatOpen)}
        sx={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
        }}
      >
        <MessageCircle />
      </Fab>
    </>
  )
}

export default FloatingActionButton
