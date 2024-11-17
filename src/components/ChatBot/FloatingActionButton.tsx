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
          bottom: {xs:10, md:20},
          right: {xs:10, md:20},
        }}
      >
        <MessageCircle />
      </Fab>
    </>
  )
}

export default FloatingActionButton
