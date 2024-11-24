import { IconButton, Stack, TextField } from '@mui/material'
import { Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React from 'react'

interface ChatInputProps {
  newQuestion: string
  setNewQuestion: React.Dispatch<React.SetStateAction<string>>
  handleSend: () => void
  disabled: boolean
}

const ChatInput: React.FC<ChatInputProps> = ({
  newQuestion,
  setNewQuestion,
  handleSend,
  disabled,
}) => {
  const t = useTranslations('chat')

  const onSend = () => {
    console.log('Sending message:', newQuestion)
    setNewQuestion(newQuestion.trim())
    handleSend()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (disabled || !newQuestion.length) return // Prevent any action if `disabled` is true
      onSend()
    }
  }

  return (
    <Stack
      direction='row'
      spacing={1}
      sx={{
        padding: 1,
        borderTop: '1px solid',
        borderColor: 'chat.bubble',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <TextField
        fullWidth
        variant='outlined'
        placeholder={t('inputPlaceholder')}
        size='small'
        value={newQuestion}
        multiline
        onChange={(e) => setNewQuestion(e.target.value)}
        onKeyDown={handleKeyDown}
        minRows={1}
        maxRows={8}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& textarea': {
              /* Custom Scrollbar Styles */
              '&::-webkit-scrollbar': {
                width: '6px', // Width of the scrollbar,
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'chat.scrollbarTrack', // Background color of the scrollbar track
                borderRadius: '8px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'chat.scrollbarThumb', // Color of the scrollbar thumb
                borderRadius: '8px',
                transition: 'background-color 2s ease',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: 'primary.dark', // Color of the scrollbar thumb on hover
                cursor: 'default',
              },
            },
          },
        }}
      />
      <IconButton
        color='primary'
        onClick={onSend}
        disabled={newQuestion === '' || disabled}
        size='large'
      >
        <Send />
      </IconButton>
    </Stack>
  )
}

export default ChatInput
