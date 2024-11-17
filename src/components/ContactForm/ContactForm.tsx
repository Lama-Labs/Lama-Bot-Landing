'use client'

import { LoadingButton } from '@mui/lab'
import {
  Alert,
  Box,
  Card,
  Container,
  TextField,
  Typography,
} from '@mui/material'
import Snackbar, { SnackbarCloseReason } from '@mui/material/Snackbar'
import { Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { sendToPushBullet } from '@/app/api/PushBulletSend'

const ContactForm = () => {
  const t = useTranslations('home.cta')

  const [email, setEmail] = useState<string>('')
  const [isValidEmail, setIsValidEmail] = useState<boolean>(false)
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false)
  const [sending, setSending] = useState<boolean>(false)


  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  }

  // Handler for TextField input change
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setEmail(value)
    setIsValidEmail(validateEmail(value)) // Update validity based on email format
  }

  // Show an alert with the email when the button is clicked
  const handleClick = async () => {
    try {
      setSending(true);
      const resp = await sendToPushBullet("email", email);
      setEmail("");
      console.log("Response:", resp);
    } catch (error) {
      console.error("An error occurred while sending to PushBullet:", error);
      setSnackbarOpen(true);
    }
    finally {
      setSending(false);
    }
  }

  const handleClose = (
    event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === 'clickaway') {
      return;
    }

    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth='xl'>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleClose}
      >
        <Alert
          onClose={handleClose}
          severity="error"
          sx={{ width: '100%' }}
        >
          An error occurred while sending the email.
        </Alert>
      </Snackbar>
      <Box
        className='animate animate-bottom'
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          mb: 6,
        }}
      >
        <Card
          variant='outlined'
          sx={{
            width: '100%',
            px: 4,
            justifyItems: 'center',
            '&:hover': {
              boxShadow: '0px 2px 5px #A7A0F8',
            },
          }}
        >
          <Box
            display='flex'
            flexDirection='column'
            maxWidth='sm'
            gap={5}
            sx={{ pt: 8, pb: 20 }}
          >
            <Typography variant='h1'>{t('title')}</Typography>
            <Typography variant='body1'>{t('subtitle')}</Typography>
            <Box
              component='form'
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                gap: 2,
                pt: 2,
              }}
            >
              <TextField
                label='Email'
                type='email'
                variant='outlined'
                fullWidth
                size='small'
                value={email}
                onChange={handleChange}
                error={!isValidEmail && email.length > 0}
                helperText={!isValidEmail && email.length > 0 ? "Please enter a valid email" : ""}
              />
              <LoadingButton
                type='submit'
                variant='contained'
                color='primary'
                loading={sending}
                disabled={!isValidEmail}
                onClick={handleClick}
              >
                <Send />
              </LoadingButton >
            </Box>
          </Box>
        </Card>
      </Box>
    </Container>
  )
}

export default ContactForm
