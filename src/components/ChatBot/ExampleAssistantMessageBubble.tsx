import { Chip, Paper, Typography } from '@mui/material'
import Cookies from 'js-cookie'
import { useTranslations } from 'next-intl'
import React from 'react'

type Assistant = {
  name: string
  initialMessage: string
  id: string
}

interface InputProps {
  setAssistantId: React.Dispatch<React.SetStateAction<string | null>>
  setResponses: React.Dispatch<
    React.SetStateAction<{ text: string; isUser: boolean }[]>
  >
}

const MessageBubble: React.FC<InputProps> = ({
  setAssistantId,
  setResponses,
}) => {
  const t = useTranslations('chat')

  return (
    <Paper
      elevation={2}
      sx={{
        padding: '8px 12px',
        maxWidth: '80%',
        alignSelf: 'flex-start',
        bgcolor: 'chat.bubble',
        color: 'chat.botText',
        borderRadius: '16px 16px 16px 4px',
        margin: '4px 0',
      }}
    >
      <Typography
        variant='body1'
        sx={{ whiteSpace: 'pre-wrap', color: 'inherit' }}
      >
        {t('initialMessage')}
      </Typography>

      {t.raw('initialAssistants').map((assistant: Assistant) => {
        return (
          <Chip
            label={assistant.name}
            key={assistant.id}
            sx={{ m: 1 }}
            clickable
            onClick={() => {
              // set assistantId to the selected assistant
              setAssistantId(assistant.id)
              setResponses([{ text: assistant.initialMessage, isUser: false }])
              Cookies.set('assistant_id', assistant.id, { expires: 1 })
              Cookies.remove('thread_id')
            }}
          />
        )
      })}
    </Paper>
  )
}

export default MessageBubble
