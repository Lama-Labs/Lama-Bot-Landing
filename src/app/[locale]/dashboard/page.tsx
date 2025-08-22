'use client'

import {
  PricingTable,
  SignedIn,
  SignedOut,
  useClerk,
  useUser,
} from '@clerk/nextjs'
import {
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Skeleton,
  Typography,
} from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'

import ApiKeySection from '@/components/Dashboard/ApiKeySection'
import ManageFiles from '@/components/Dashboard/ManageFiles'

const Dashboard = () => {
  const { user, isLoaded } = useUser()
  const locale = useLocale()
  const { openUserProfile, openSignIn } = useClerk()
  const t = useTranslations('dashboard')

  if (!isLoaded) {
    return (
      <Container
        maxWidth='md'
        sx={{
          minHeight: '200px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress />
      </Container>
    )
  }

  return (
    <>
      <SignedIn>
        <Container maxWidth='md' sx={{ mt: 8, py: 4 }}>
          <Paper
            elevation={3}
            sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}
          >
            {user && (
              <>
                <Typography variant='h4' gutterBottom>
                  {t('account.title')}
                </Typography>
                <Typography variant='body1' color='text.secondary'>
                  {t('account.subtitle', {
                    email: user?.emailAddresses[0]?.emailAddress ?? '',
                  })}
                </Typography>

                {/* File Management Section */}
                <ManageFiles />

                {/* API Key Section */}
                <ApiKeySection user={user} isLoaded={isLoaded} />

                <PricingTable
                  newSubscriptionRedirectUrl={`/${locale}/dashboard`}
                  fallback={
                    <Skeleton variant='rectangular' width={790} height={225} />
                  }
                />
                <Typography
                  variant='body1'
                  color='primary'
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                  onClick={() => openUserProfile()}
                >
                  {t('subscription.manageLink')}
                </Typography>
              </>
            )}
          </Paper>
        </Container>
      </SignedIn>
      <SignedOut>
        <Container maxWidth='md' sx={{ mt: 8, py: 4 }}>
          <Paper
            elevation={3}
            sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <Typography variant='h4' gutterBottom>
              {t('signedOut.title')}
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              {t('signedOut.subtitle')}
            </Typography>
            <PricingTable newSubscriptionRedirectUrl={`/${locale}/dashboard`} />
            <Divider />
            <Typography variant='body1' align='center'>
              Have an account?
            </Typography>
            <Button
              variant='contained'
              sx={{ display: 'block', mx: 'auto' }}
              onClick={() => openSignIn()}
            >
              Log in
            </Button>
          </Paper>
        </Container>
      </SignedOut>
    </>
  )
}

export default Dashboard
