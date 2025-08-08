'use client'

import {
  PricingTable,
  SignedIn,
  SignedOut,
  useClerk,
  useUser,
} from '@clerk/nextjs'
import {
  CircularProgress,
  Container,
  Paper,
  Skeleton,
  Typography,
} from '@mui/material'
import { useLocale } from 'next-intl'

import ApiKeySection from '@/components/Dashboard/ApiKeySection'
import ManageFiles from '@/components/Dashboard/ManageFiles'

const Dashboard = () => {
  const { user, isLoaded } = useUser()
  const locale = useLocale()
  const { openUserProfile } = useClerk()

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
                  My Account
                </Typography>
                <Typography variant='body1' color='text.secondary'>
                  Manage subscription and billing details for your account (
                  {user?.emailAddresses[0]?.emailAddress})
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
                  Manage your subscription
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
              Get your own AI-powered chatbot
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              Sign up for an account to get your own AI-powered chatbot.
            </Typography>
            <PricingTable newSubscriptionRedirectUrl={`/${locale}/dashboard`} />
          </Paper>
        </Container>
      </SignedOut>
    </>
  )
}

export default Dashboard
