import { Chip, Paper, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { useChat } from '@/context/ChatContext'
import {
  appendConversationTurn,
  clearConversation,
  clearThreadId,
  setAssistantId as setAssistantIdCookie,
} from '@/utils/CookieHelpers'

type Assistant = {
  name: string
  initialMessage: string
  id: string
  suggestions?: string[]
}

interface InputProps {
  setAssistantId: React.Dispatch<React.SetStateAction<string | null>>
  setResponses: React.Dispatch<
    React.SetStateAction<
      { text: string; isUser: boolean; suggestions?: string[] }[]
    >
  >
  namespace?: string
}

const MessageBubble: React.FC<InputProps> = ({
  setAssistantId,
  setResponses,
  namespace = '',
}) => {
  const t = useTranslations('chat')
  const { setAssistantName } = useChat()

  return (
    <Paper
      elevation={2}
      sx={{
        padding: '8px 12px',
        maxWidth: '80%',
        alignSelf: 'flex-start',
        bgcolor: 'primary.main',
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
            sx={{ m: 1, color: 'white' }}
            color='secondary'
            clickable
            onClick={() => {
              // set assistantId to the selected assistant
              setAssistantId(assistant.id)
              setResponses([
                {
                  text: assistant.initialMessage,
                  isUser: false,
                  suggestions: assistant.suggestions,
                },
              ])
              setAssistantIdCookie(assistant.id, namespace)
              clearThreadId(namespace)
              clearConversation(namespace)
              // update header title via context
              setAssistantName(assistant.name)
              // Persist the assistant's initial message so it survives reload
              appendConversationTurn(
                {
                  role: 'assistant',
                  content: assistant.initialMessage,
                },
                namespace
              )
            }}
          />
        )
      })}
    </Paper>
  )
}

export default MessageBubble
