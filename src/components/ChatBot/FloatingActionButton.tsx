'use client'

import { Box, Fab, Fade } from '@mui/material'
import { MessageCircle } from 'lucide-react'
import React, { useState } from 'react'

import ChatField from '@/components/ChatBot/ChatField'

const FloatingActionButton: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 80, md: 100 }, // Positioning above the FAB
          right: { xs: 10, md: 20 },
          zIndex: 10, // Ensure it's above other elements
        }}
      >
        <Fade in={isChatOpen}>
          <Box>
            <ChatField />
          </Box>
        </Fade>
      </Box>
      <Fab
        color='primary'
        aria-label='open chat'
        onClick={() => setIsChatOpen(!isChatOpen)}
        sx={{
          position: 'fixed',
          bottom: { xs: 10, md: 20 },
          right: { xs: 10, md: 20 },
        }}
      >
        <MessageCircle />
      </Fab>
    </>
  )
}

export default FloatingActionButton
