import { Box, Button, Container, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

const Hero = () => {
  const t = useTranslations('home')

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
          {t('hero.title')}
        </Typography>
        <Typography variant='body1' sx={{ mb: 4 }}>
          {t('hero.subtitle')}
        </Typography>
        <Button variant='contained' color='primary' size='large'>
          {t('hero.cta')}
        </Button>
      </Container>
    </Box>
  )
}

export default Hero
