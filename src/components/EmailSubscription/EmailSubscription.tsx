'use client'

import { LoadingButton } from '@mui/lab'
import { Box, Link, TextField, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { sendGAEvent } from '@next/third-parties/google'
import Cookies from 'js-cookie'
import { Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { RefObject, useRef, useState } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'

import { sendToPushBullet } from '@/app/api/PushBulletSend'
import { validateRecaptchaToken } from '@/app/api/validateRecaptcha'
import SnackbarComponent, {
  SnackbarHandle,
} from '@/components/Snackbar/SnackbarComponent'

export interface EmailSubscriptionProps {
  displayMode?: 'text' | 'icon'
  buttonText?: string
  containerSx?: SxProps<Theme>
  buttonSx?: SxProps<Theme>
  textFieldSx?: SxProps<Theme>
  hideCaptchaNotice?: boolean
}

const EmailSubscription = ({
  displayMode = 'text',
  buttonText,
  containerSx,
  buttonSx,
  textFieldSx,
  hideCaptchaNotice = false,
}: EmailSubscriptionProps) => {
  const tHome = useTranslations('home')
  const tCTA = useTranslations('home.cta')

  const [email, setEmail] = useState<string>('')
  const [isValidEmail, setIsValidEmail] = useState<boolean>(true)
  const [sending, setSending] = useState<boolean>(false)

  const recaptchaRef = useRef<ReCAPTCHA>()
  const snackbarRef = useRef<SnackbarHandle>(null)

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setEmail(value)
  }

  const handleSubmit = async (
    event:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    try {
      setSending(true)

      if (!recaptchaRef.current) {
        throw new Error('reCAPTCHA ref error')
      }

      const validEmail = validateEmail(email)
      setIsValidEmail(validEmail)
      if (!validEmail) {
        return
      }

      const token = await recaptchaRef.current.executeAsync()

      if (!token) {
        throw new Error('reCAPTCHA token error')
      }

      const isCaptchaValid = await validateRecaptchaToken(token!)
      if (!isCaptchaValid) {
        throw new Error('reCAPTCHA validation error')
      }

      if (Cookies.get('analytics-consent') === 'true') {
        sendGAEvent({
          action: 'click',
          category: 'Button',
          label: 'Join Waitlist clicked',
          value: email,
        })
      }

      await sendToPushBullet('email', email)

      recaptchaRef.current.reset()
      setEmail('')
      setIsValidEmail(true)
      snackbarRef?.current?.snackbarOpenSuccess()
    } catch (error) {
      console.error('An error occurred while sending to PushBullet:', error)
      snackbarRef?.current?.snackbarOpenError()
    } finally {
      setSending(false)
    }
  }

  const resolvedButtonText =
    displayMode === 'text' ? buttonText || tHome('hero.cta') : undefined

  return (
    <>
      <SnackbarComponent ref={snackbarRef} />
      <Box
        component='form'
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          alignItems: 'start',
          width: '100%',
          gap: 2,
          pt: 0,
          zIndex: 2,
          ...containerSx,
        }}
      >
        <Box
          display='flex'
          flexDirection='column'
          gap={0.5}
          sx={{ width: '100%' }}
        >
          <Box display='flex' gap={2}>
            <TextField
              label='Email'
              type='email'
              variant='outlined'
              fullWidth
              size='small'
              value={email}
              onChange={handleChange}
              error={!isValidEmail}
              helperText={!isValidEmail ? tCTA('errors.email') : ' '}
              sx={{
                '& .MuiFormHelperText-root': {
                  visibility: !isValidEmail ? 'visible' : 'hidden',
                  minHeight: '1.5em',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'primary.main',
                },
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                    boxShadow: '0px 2px 10px #A7A0F866',
                    transition: 'box-shadow 0.25s ease-in-out',
                  },
                },
                ...textFieldSx,
              }}
            />
            <LoadingButton
              type='submit'
              variant='contained'
              color='primary'
              loading={sending}
              onClick={handleSubmit}
              sx={{ height: '40px', flex: 'none', ...buttonSx }}
            >
              {displayMode === 'icon' ? <Send /> : resolvedButtonText}
            </LoadingButton>
          </Box>
          {!hideCaptchaNotice && (
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
          )}
        </Box>
        <ReCAPTCHA
          ref={recaptchaRef as RefObject<ReCAPTCHA>}
          size='invisible'
          sitekey={process.env.NEXT_PUBLIC_CAPTCHA_SITEKEY || 'aaa'}
        />
      </Box>
    </>
  )
}

export default EmailSubscription
