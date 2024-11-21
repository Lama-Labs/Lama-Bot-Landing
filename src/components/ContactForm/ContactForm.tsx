'use client'

import { LoadingButton } from '@mui/lab'
import {
  Box,
  Card,
  Container,
  Link,
  TextField,
  Typography,
} from '@mui/material'
import { sendGAEvent } from '@next/third-parties/google'
import Cookies from 'js-cookie'
import { Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React, { RefObject, useRef, useState } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'

import { sendToPushBullet } from '@/app/api/PushBulletSend'
import { validateRecaptchaToken } from '@/app/api/validateRecaptcha'
import SnackbarComponent, { SnackbarHandle } from '@/components/Snackbar/SnackbarComponent'

const ContactForm = () => {
  const t = useTranslations('home.cta')

  const [email, setEmail] = useState<string>('')
  const [isValidEmail, setIsValidEmail] = useState<boolean>(true)
  const [sending, setSending] = useState<boolean>(false)

  const recaptchaRef = useRef<ReCAPTCHA>()
  const snackbarRef = useRef<SnackbarHandle>(null);

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
  const handleClick = async (event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    try {
      setSending(true)

      if (!recaptchaRef.current) {
        throw new Error('reCAPTCHA ref error')
      }

      const validEmail = validateEmail(email)
      setIsValidEmail(validEmail) // Update validity based on email format
      if (!validEmail) {
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

      if (Cookies.get('analytics-consent') === 'true') {
        sendGAEvent({
          action: 'click',
          category: 'Button',
          label: 'Send email clicked',
          value: email,
        })
      }

      await sendToPushBullet('email', email)

      // clear captcha
      recaptchaRef.current.reset()
      setEmail('')
      setIsValidEmail(true)
      snackbarRef?.current?.snackbarOpenSuccess();
    } catch (error) {
      console.error('An error occurred while sending to PushBullet:', error)
      snackbarRef?.current?.snackbarOpenError();
    } finally {
      setSending(false)
    }
  }

  return (
    <Container maxWidth='xl' id='contact'>
      <SnackbarComponent ref={snackbarRef}/>
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
              boxShadow: '0px 2px 10px #A7A0F866',
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
            <Typography variant='h2'>{t('title')}</Typography>
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
              <Box
                display='flex'
                flexDirection='column'
                gap={0.5}
                sx={{ width: '100%' }}
              >
                <TextField
                  label='Email'
                  type='email'
                  variant='outlined'
                  fullWidth
                  size='small'
                  value={email}
                  onChange={handleChange}
                  error={!isValidEmail}
                  helperText={!isValidEmail ? t('errors.email') : ' '}
                  sx={{
                    '& .MuiFormHelperText-root': {
                      visibility: !isValidEmail ? 'visible' : 'hidden', // Toggle visibility
                      minHeight: '1.5em', // Fixed height for the helper text
                    },
                  }}
                />
                <Typography
                  sx={{ px: 1, py: 0.5 }}
                  variant='caption'
                  textAlign='start'
                  fontSize={10}
                >
                  This site is protected by reCAPTCHA and the Google{' '}
                  <Link
                    href='https://policies.google.com/privacy'
                    target='_blank'
                    underline='none'
                  >
                    Privacy Policy
                  </Link>{' '}
                  and{' '}
                  <Link
                    href='https://policies.google.com/terms'
                    target='_blank'
                    underline='none'
                  >
                    Terms of Service
                  </Link>{' '}
                  apply.
                </Typography>
              </Box>
              <LoadingButton
                type='submit'
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
