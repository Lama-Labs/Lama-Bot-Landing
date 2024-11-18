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
import { sendGAEvent } from '@next/third-parties/google'
import { Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { RefObject, useRef, useState } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'

import { sendToPushBullet } from '@/app/api/PushBulletSend'
import { validateRecaptchaToken } from '@/app/api/validateRecaptcha'

const ContactForm = () => {
  const t = useTranslations('home.cta')

  const [email, setEmail] = useState<string>('')
  const [isValidEmail, setIsValidEmail] = useState<boolean>(true)
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false)
  const [sending, setSending] = useState<boolean>(false)

  const recaptchaRef = useRef<ReCAPTCHA>()

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  }

  // Handler for TextField input change
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setEmail(value)
  }

  // Show an alert with the email when the button is clicked
  const handleClick = async () => {
    try {
      setSending(true)

      if (!recaptchaRef.current) {
        setSnackbarOpen(true)
        throw new Error('reCAPTCHA ref error')
      }

      const validEmail = validateEmail(email)
      setIsValidEmail(validEmail) // Update validity based on email format
      if(!validEmail) {
        return
      }

      const token = await recaptchaRef.current.executeAsync()

      // if no token, don't submit
      if (!token) {
        throw new Error('reCAPTCHA token error')
      }
      // validate token
      const isCaptchaValid = await validateRecaptchaToken(token!)

      if (!isCaptchaValid) {
        throw new Error('reCAPTCHA validation error')
      }

      sendGAEvent({
        action: 'click',
        category: 'Button',
        label: 'Send email clicked',
        value: email,
      })
      await sendToPushBullet('email', email)

      // clear captcha
      recaptchaRef.current.reset()
      setEmail('')
      setIsValidEmail(true)
    } catch (error) {
      console.error('An error occurred while sending to PushBullet:', error)
      setSnackbarOpen(true)
    } finally {
      setSending(false)
    }
  }

  const handleClose = (
    event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === 'clickaway') {
      return
    }

    setSnackbarOpen(false)
  }

  return (
    <Container maxWidth='xl'>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleClose}
      >
        <Alert onClose={handleClose} severity='error' sx={{ width: '100%' }}>
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
                alignItems: 'start',
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
                helperText={
                  !isValidEmail && email.length > 0
                    ? t('errors.email')
                    : ' '
                }
                sx={{
                  '& .MuiFormHelperText-root': {
                    visibility: email.length > 0 && !isValidEmail ? 'visible' : 'hidden', // Toggle visibility
                    height: '1.5em', // Fixed height for the helper text
                  },
                }}
              />
              <LoadingButton
                type='button'
                variant='contained'
                color='primary'
                loading={sending}
                onClick={handleClick}
              >
                <Send />
              </LoadingButton>
              <ReCAPTCHA
                ref={recaptchaRef as RefObject<ReCAPTCHA>}
                size='invisible'
                sitekey={process.env.NEXT_PUBLIC_CAPTCHA_SITEKEY || 'aaa'}
              />
            </Box>
          </Box>
        </Card>
      </Box>
    </Container>
  )
}

export default ContactForm
