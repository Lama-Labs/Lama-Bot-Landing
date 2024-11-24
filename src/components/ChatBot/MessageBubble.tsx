import { Paper, Typography } from '@mui/material'
import React from 'react'

interface MessageBubbleProps {
  message: string
  isUser: boolean
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isUser }) => {
  return (
    <Paper
      elevation={2}
      sx={{
        padding: '8px 12px',
        maxWidth: '80%',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        bgcolor: isUser ? 'primary.main' : 'chat.bubble', // Use primary color from theme
        color: isUser ? 'chat.userText' : 'chat.botText', // Adjust text color for contrast
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        margin: '4px 0',
      }}
    >
      <Typography
        variant='body1'
        sx={{ whiteSpace: 'pre-wrap', color: 'inherit' }}
      >
        {message}
      </Typography>
    </Paper>
  )
}

export default MessageBubble
