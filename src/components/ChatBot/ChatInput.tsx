import { IconButton, Stack, TextField } from '@mui/material'
import { Send } from 'lucide-react'
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
  const onSend = () => {
    console.log('Sending message:', newQuestion)
    setNewQuestion(newQuestion.trim())
    handleSend()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (disabled) return // Prevent any action if `disabled` is true
      onSend()
    }
  }

  return (
    <Stack
      direction='row'
      spacing={1}
      sx={{ padding: 1, borderTop: '1px solid #ccc' }}
    >
      <TextField
        fullWidth
        variant='outlined'
        placeholder='Type a message'
        value={newQuestion}
        multiline
        onChange={(e) => setNewQuestion(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <IconButton
        color='primary'
        onClick={onSend}
        disabled={newQuestion === '' || disabled}
      >
        <Send />
      </IconButton>
    </Stack>
  )
}

export default ChatInput
