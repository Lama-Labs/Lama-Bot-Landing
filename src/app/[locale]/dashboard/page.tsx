'use client'

import {
  PricingTable,
  SignedIn,
  SignedOut,
  useAuth,
  useClerk,
  useUser,
} from '@clerk/nextjs'
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Fab,
  Fade,
  Grid2,
  Paper,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import ChatBotAnimation from '@/components/ChatBot/ChatBotAnimation'
import ChatWindow from '@/components/ChatBot/ChatWindow'
import ApiKeySection from '@/components/Dashboard/ApiKeySection'
import ManageFiles from '@/components/Dashboard/ManageFiles'
import { hasAnyPlan } from '@/utils/clerk/subscription'

const Dashboard = () => {
  const { user, isLoaded } = useUser()
  const { has } = useAuth()
  const locale = useLocale()
  const { openUserProfile, openSignIn } = useClerk()
  const t = useTranslations('dashboard')
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Check if user has active subscription using Clerk's billing API
  const hasActiveSubscription = hasAnyPlan(has, 'basic', user?.publicMetadata)

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
        <Container maxWidth='xl' sx={{ mt: 8, py: 4 }}>
          <Grid2 container spacing={4}>
            {/* Main Content */}
            <Grid2
              size={{ xs: 12, md: hasActiveSubscription && isMdUp ? 7 : 12 }}
            >
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
                        <Skeleton
                          variant='rectangular'
                          width={790}
                          height={225}
                        />
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
            </Grid2>

            {/* Chat Window - Desktop Only (Embedded) */}
            {hasActiveSubscription && isMdUp && (
              <Grid2 size={{ md: 5 }}>
                <Box
                  sx={{
                    position: 'sticky',
                    top: 100,
                    height: 'calc(100vh - 150px)',
                    minHeight: '500px',
                  }}
                >
                  <ChatWindow mode='dashboard' embedded />
                </Box>
              </Grid2>
            )}
          </Grid2>

          {/* Chat Window - Mobile Only (FAB) */}
          {hasActiveSubscription && !isMdUp && (
            <>
              <Box
                sx={{
                  position: 'fixed',
                  bottom: { xs: 80, md: 100 },
                  right: { xs: 10, md: 20 },
                  zIndex: 10,
                }}
              >
                <Fade in={isChatOpen}>
                  <Box>
                    <ChatWindow mode='dashboard' />
                  </Box>
                </Fade>
              </Box>
              <Fab
                color='primary'
                aria-label='open chat'
                onClick={() => setIsChatOpen(!isChatOpen)}
                sx={{
                  position: 'fixed',
                  bottom: { xs: 10, md: 20 },
                  right: { xs: 10, md: 20 },
                }}
              >
                <Box
                  sx={{
                    transform: 'scale(0.025) translate(0, -100px)',
                    pointerEvents: 'none',
                  }}
                >
                  <ChatBotAnimation />
                </Box>
              </Fab>
            </>
          )}
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
              {t('signedOut.haveAccount')}
            </Typography>
            <Button
              variant='contained'
              sx={{ display: 'block', mx: 'auto' }}
              onClick={() => openSignIn()}
            >
              {t('signedOut.logInButton')}
            </Button>
          </Paper>
        </Container>
      </SignedOut>
    </>
  )
}

export default Dashboard
