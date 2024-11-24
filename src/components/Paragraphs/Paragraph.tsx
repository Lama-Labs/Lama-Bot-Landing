/*import Image from 'next/image'
import { height } from '@mui/system'*/
import { Box, Card, Typography } from '@mui/material'
import React from 'react'

import MessageBubble from '@/components/ChatBot/MessageBubble'
import MapIcon from '@/utils/MapIcon'

interface Message {
  text: string
  isUser: boolean
}

interface ParagraphProps {
  pretitle: string
  title: string
  description: string
  image: string
  icon: string
  messages: [Message]
}

const Paragraph: React.FC<ParagraphProps> = ({
  pretitle,
  title,
  description,
  //image,
  icon,
  messages = [],
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 4,
        alignItems: 'center',
      }}
    >
      <Box
        className='animate animate-left'
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'start',
          gap: 2,
          width: { xs: '100%', md: '50%' },
          pr: { xs: 2, md: 10 },
        }}
      >
        <Box display='flex' gap={1} alignItems='center'>
          <MapIcon iconName={icon} color='#A7A0F8' size={16} />
          <Typography variant='body1' color='primary'>
            {pretitle}
          </Typography>
        </Box>
        <Typography variant='h2' sx={{ pt: 2 }}>
          {title}
        </Typography>
        <Typography variant='body1'>{description}</Typography>
      </Box>
      <Box
        className='animate animate-right delay-250'
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Card variant='outlined' sx={{ p: { xs: 1, md: 4 }, width: '100%' }}>
          <Box
            sx={{
              minHeight: 225,
              minWidth: 300,
              display: 'flex',
              background:
                'radial-gradient(ellipse, #A7A0F844 0%, transparent 70%)',
            }}
          >
            <Box
              sx={{
                flex: 1,
                padding: 2,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                opacity: 0.9,
                gap: 1,
              }}
            >
              {messages.map((msg, index) => (
                <MessageBubble
                  key={index}
                  message={msg.text}
                  isUser={msg.isUser}
                />
              ))}
            </Box>
          </Box>
        </Card>
      </Box>
    </Box>
  )
}

export default Paragraph
