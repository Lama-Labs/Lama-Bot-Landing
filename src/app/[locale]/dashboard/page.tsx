'use client'

import {
  PricingTable,
  SignedIn,
  SignedOut,
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
  Grid,
  Paper,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { getSubscriptionStatus } from '@/app/actions/subscription'
import ChatBotAnimation from '@/components/ChatBot/ChatBotAnimation'
import ChatWindow from '@/components/ChatBot/ChatWindow'
import ApiKeySection from '@/components/Dashboard/ApiKeySection'
import CustomInstructions from '@/components/Dashboard/CustomInstructions'
import ManageFiles from '@/components/Dashboard/ManageFiles'
import { usePreventClerkCheckoutDismiss } from '@/hooks/usePreventClerkCheckoutDismiss'

const Dashboard = () => {
  const { user, isLoaded } = useUser()
  const locale = useLocale()
  const { openUserProfile, openSignIn } = useClerk()
  const t = useTranslations('dashboard')
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const searchParams = useSearchParams()

  // Prevent closing the Clerk checkout drawer via outside click or Escape
  usePreventClerkCheckoutDismiss(true)

  // Check subscription status from server
  useEffect(() => {
    if (user && isLoaded) {
      getSubscriptionStatus().then(setHasActiveSubscription)
    }
  }, [user, isLoaded, refreshKey])

  // Handle subscription completion redirect
  useEffect(() => {
    const subscribed = searchParams.get('subscribed')
    if (subscribed === 'true' && user) {
      // Force Clerk to reload user data (including subscription metadata)
      user.reload().then(() => {
        // After user data is refreshed, force component refresh
        setRefreshKey((prev) => prev + 1)
        // Clean up URL
        window.history.replaceState({}, '', `/${locale}/dashboard`)
      })
    }
  }, [searchParams, locale, user])

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
          <Grid container spacing={4}>
            {/* Main Content */}
            <Grid
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

                    {/* Custom Instructions Section */}
                    <CustomInstructions user={user} isLoaded={isLoaded} />

                    {/* API Key Section */}
                    <ApiKeySection
                      key={refreshKey}
                      user={user}
                      isLoaded={isLoaded}
                    />

                    <PricingTable
                      newSubscriptionRedirectUrl={`/${locale}/dashboard?subscribed=true`}
                      appearance={{
                        variables: {
                          colorPrimary: theme.palette.primary.main,
                        },
                      }}
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
            </Grid>

            {/* Chat Window - Desktop Only (Embedded) */}
            {hasActiveSubscription && isMdUp && (
              <Grid size={{ md: 5 }}>
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
              </Grid>
            )}
          </Grid>

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
            <PricingTable
              appearance={{
                variables: {
                  colorPrimary: theme.palette.primary.main,
                },
              }}
              newSubscriptionRedirectUrl={`/${locale}/dashboard?subscribed=true`}
            />
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
