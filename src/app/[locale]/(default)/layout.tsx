import { Box, CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

import AnalyticsConsentProvider from '@/components/Analytics/AnalyticsConsentProvider'
import AnimateOnScroll from '@/components/Animations/AnimateOnScroll'
import FloatingActionButton from '@/components/ChatBot/FloatingActionButton'
import Footer from '@/components/Footer/Footer'
import Navbar from '@/components/Navbar/Navbar'
import { ChatProvider } from '@/context/ChatContext'
import { routing } from '@/i18n/routing'
import theme from '@/theme/theme'
import '@/globals.css'

export const metadata: Metadata = {
  title: 'Alpaca Chat',
  description:
    'Seamless custom AI chatbot integration in minutes — no coding skills required',
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as never)) {
    notFound()
  }

  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <NextIntlClientProvider messages={messages}>
              <ChatProvider>
                <Navbar />
                <AnimateOnScroll />
                {children}
                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                  <FloatingActionButton />
                </Box>
                <Footer />
                <AnalyticsConsentProvider />
              </ChatProvider>
            </NextIntlClientProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
