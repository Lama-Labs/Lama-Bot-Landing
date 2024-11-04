import { Box, Button, TextField, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

const ContactForm = () => {
  const t = useTranslations('home.cta')

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        maxWidth: 400,
        margin: 'auto',
        textAlign: 'center',
        mb: 6,
      }}
    >
      <Typography variant='h5'>{t('title')}</Typography>
      <Typography variant='body1'>{t('subtitle')}</Typography>
      <Box
        component='form'
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          width: '100%',
        }}
      >
        <TextField label='Email' type='email' variant='outlined' fullWidth />
        <Button type='submit' variant='contained' color='primary'>
          {t('button')}
        </Button>
      </Box>
    </Box>
  )
}

export default ContactForm
