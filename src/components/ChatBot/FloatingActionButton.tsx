'use client'

import { Box, Fab, Fade } from '@mui/material'
import React, { useState } from 'react'

import ChatBotAnimation from '@/components/ChatBot/ChatBotAnimation'
import ChatField from '@/components/ChatBot/ChatField'
import { useChat } from '@/context/ChatContext'

const FloatingActionButton: React.FC = () => {
  const { isChatOpen, setIsChatOpen } = useChat()
  const [animationStarted, setAnimationStarted] = useState(false)

  const restartAnimation = () => {
    if (!animationStarted && !isChatOpen) {
      const svgAnimation = document.getElementById(
        'svgAnimation'
      ) as unknown as SVGAnimateElement
      if (svgAnimation) {
        svgAnimation.beginElement()
        setAnimationStarted(true)
        setTimeout(() => {
          setAnimationStarted(false)
        }, 3000)
      }
    }
  }

  const handleChatOpen = () => {
    setIsChatOpen(!isChatOpen)
    restartAnimation()
  }

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
        onClick={handleChatOpen}
        sx={{
          position: 'fixed',
          bottom: { xs: 10, md: 20 },
          right: { xs: 10, md: 20 },
        }}
        onMouseEnter={restartAnimation}
      >
        <Box
          sx={{
            transform: 'scale(0.025) translate(0, -100px)',
            pointerEvents: 'none',
          }}
        >
          <ChatBotAnimation />
        </Box>
      </Fab>
    </>
  )
}

export default FloatingActionButton
