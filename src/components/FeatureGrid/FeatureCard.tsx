import React from 'react'
import { Box, Card, Typography } from '@mui/material'
import { RefreshCcw } from 'lucide-react'

const FeatureCard = () => {
  return (
    <Card
      variant='outlined'
      sx={{
        textAlign: 'center',
        px: 6,
        py: 4,
        '&:hover': {
          boxShadow: '0px 2px 5px #A7A0F8',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: 48,
          height: 48,
          margin: '0 auto 16px',
        }}
      >
        <RefreshCcw color='#A7A0F8' size={24} />
      </Box>
      <Typography variant='h6' component='h2' gutterBottom>
        Dynamic Suggestions
      </Typography>
      <Typography variant='body2'>
        Ai-Con provides dynamic topic suggestions based on your interests and
        previous conversations.
      </Typography>
    </Card>
  )
}

export default FeatureCard
