'use client'

import { Alert, AlertTitle, Box, Button } from '@mui/material'
import { GoogleAnalytics } from '@next/third-parties/google'
import Cookies from 'js-cookie'
import { Cookie } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

const AnalyticsConsentProvider: React.FC = () => {
  const t = useTranslations('cookies')

  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)
  const [consentGiven, setConsentGiven] = useState(true)
  const trackingId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || 'aa'

  useEffect(() => {
    const consent = Cookies.get('analytics-consent')
    setAnalyticsEnabled(consent === 'true')
    setConsentGiven(!!consent)
  }, [])

  const handleAccept = () => {
    Cookies.set('analytics-consent', 'true', { expires: 365 })
    setAnalyticsEnabled(true)
    setConsentGiven(true)
  }

  const handleDecline = () => {
    Cookies.set('analytics-consent', 'false', { expires: 7 })
    setAnalyticsEnabled(false)
    setConsentGiven(true)
  }

  return (
    <>
      {!consentGiven && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 10,
            left: 10,
            width: '40vmax',
            maxWidth: '75%',
          }}
        >
          <Alert
            severity='info'
            color={'primary'}
            iconMapping={{
              info: <Cookie />,
            }}
          >
            <AlertTitle>{t('title')}</AlertTitle>
            {t('message')}
            <br />
            <Button onClick={handleAccept}>{t('accept')}</Button>
            <Button onClick={handleDecline}>{t('reject')}</Button>
          </Alert>
        </Box>
      )}
      {analyticsEnabled && <GoogleAnalytics gaId={trackingId} />}
    </>
  )
}

export default AnalyticsConsentProvider
