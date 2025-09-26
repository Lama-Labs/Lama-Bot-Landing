import { Box, IconButton } from '@mui/material'
import { Trash } from 'lucide-react'
import Image from 'next/image'

interface ChatHeaderProps {
  onReset: () => void
  title?: string
  icon?: string
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  onReset,
  title = 'Alpaca Chat',
  icon = '/alpaca logo.svg',
}) => {
  return (
    <Box
      sx={{
        px: 2.5,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'primary.main',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'primary.contrastText',
            fontWeight: 600,
          }}
        >
          <Image src={icon} alt={'Chat Icon'} width={30} height={30} />
        </Box>
        <Box
          sx={{
            color: 'primary.contrastText',
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          {title}
        </Box>
      </Box>
      <IconButton
        onClick={onReset}
        sx={{
          color: 'primary.contrastText',
          width: 40,
          height: 40,
          borderRadius: '50%',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.2)',
          },
        }}
        aria-label='Reset conversation'
      >
        <Trash size={20} />
      </IconButton>
    </Box>
  )
}

export default ChatHeader
