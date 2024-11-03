import React from 'react'
import { Box, Typography, Button, Container } from '@mui/material'

const Hero = () => {
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <Container maxWidth='sm'>
        <Typography
          variant='h1'
          sx={{
            fontSize: { xs: '2.5rem', md: '4rem' },
            fontWeight: 'bold',
            mb: 2,
          }}
        >
          Hero Title
        </Typography>
        <Typography variant='body1' sx={{ fontSize: '1.2rem', mb: 4 }}>
          This is some regular text below the main title. It can be a brief
          description or tagline.
        </Typography>
        <Button variant='contained' color='primary' size='large'>
          Get Started
        </Button>
      </Container>
    </Box>
  )
}

export default Hero
