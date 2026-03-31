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

import { ensureUserInDatabase } from '@/app/actions/ensure-user'
import {
  type SubscriptionStatus,
  getSubscriptionStatus,
} from '@/app/actions/subscription'
import ChatBotAnimation from '@/components/ChatBot/ChatBotAnimation'
import ChatWindow from '@/components/ChatBot/ChatWindow'
import ApiKeySection from '@/components/Dashboard/ApiKeySection'
import CustomInstructions from '@/components/Dashboard/CustomInstructions'
import ManageFiles from '@/components/Dashboard/ManageFiles'
import WebsiteKnowledge from '@/components/Dashboard/WebsiteKnowledge'
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
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    hasSubscription: false,
    hasPlusPlan: false,
  })
  const searchParams = useSearchParams()

  // Prevent closing the Clerk checkout drawer via outside click or Escape
  usePreventClerkCheckoutDismiss(true)

  // Ensure user exists in DB (fallback if webhook failed) and check subscription status
  useEffect(() => {
    const initUser = async () => {
      await ensureUserInDatabase()
      const status = await getSubscriptionStatus()
      setSubscription(status)
    }

    if (user && isLoaded) {
      initUser()
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
              size={{ xs: 12, md: subscription.hasSubscription && isMdUp ? 7 : 12 }}
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

                    {subscription.hasSubscription && (
                      <>

                        {/* Website Knowledge Section */}
                        <WebsiteKnowledge />

                        {/* Custom Instructions Section */}
                        <CustomInstructions user={user} isLoaded={isLoaded} />

                        {/* File Management Section (Plus plan only) */}
                        {subscription.hasPlusPlan && <ManageFiles />}

                        {/* API Key Section */}
                        <ApiKeySection
                          key={refreshKey}
                          user={user}
                          isLoaded={isLoaded}
                        />
                        <Divider />
                      </>
                    )}

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
            {subscription.hasSubscription && isMdUp && (
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
          {subscription.hasSubscription && !isMdUp && (
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
