import { Box, Paper, Typography } from '@mui/material'

import MarkdownParser from '@/utils/MarkdownParser'

interface MessageBubbleProps {
  message: string
  isUser: boolean
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isUser }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        mb: 1,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          px: 2,
          py: 1.5,
          maxWidth: '80%',
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          bgcolor: isUser ? 'chat.bubble' : 'primary.main', // Use primary color from theme
          color: isUser ? 'chat.userText' : 'chat.botText', // Adjust text color for contrast
          borderRadius: isUser ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
          fontSize: 24,
          wordBreak: 'break-word',
        }}
      >
        {!message && <Box className='loader' />}
        <Typography
          variant='body1'
          textAlign='left'
          sx={{ whiteSpace: 'pre-wrap', color: 'inherit' }}
        >
          <MarkdownParser
            text={message
              .replace(/^\[\w+]\s*/, '')
              .replace(/【\d+:\d+†.+】/g, '')}
          />
        </Typography>
      </Paper>
    </Box>
  )
}

export default MessageBubble
