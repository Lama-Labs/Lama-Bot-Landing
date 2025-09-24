import { IconButton, Stack, TextField } from '@mui/material'
import { Send } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ChatInputProps {
  newQuestion: string
  setNewQuestion: React.Dispatch<React.SetStateAction<string>>
  handleSend: (override?: string) => void
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
    const trimmed = newQuestion.trim()
    setNewQuestion(trimmed)
    handleSend(trimmed)
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
      sx={{
        px: 2.5,
        py: 1.5,
        bgcolor: 'chat.background',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack
        direction='row'
        spacing={1.5}
        sx={{
          alignItems: 'center',
          bgcolor: 'grey.700',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '24px',
          px: 2,
          py: 0.5,
        }}
      >
        <TextField
          fullWidth
          variant='standard'
          placeholder={t('inputPlaceholder')}
          value={newQuestion}
          multiline
          onChange={(e) => setNewQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          minRows={1}
          maxRows={6}
          slotProps={{
            input: {
              disableUnderline: true,
            },
          }}
          sx={{
            '& .MuiInputBase-root': {
              py: 1.5,
            },
            '& textarea': {
              color: 'white',
              fontSize: 14,
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
          }}
        />
        <IconButton
          onClick={onSend}
          disabled={newQuestion.trim() === '' || disabled}
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { filter: 'brightness(0.95)' },
          }}
          aria-label='Send message'
        >
          <Send />
        </IconButton>
      </Stack>
    </Stack>
  )
}

export default ChatInput
