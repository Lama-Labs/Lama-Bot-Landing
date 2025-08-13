import { ClerkProvider } from '@clerk/nextjs'
import { Box, CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

import AnalyticsConsentProvider from '@/components/Analytics/AnalyticsConsentProvider'
import Footer from '@/components/Footer/Footer'
import DashboardNavbar from '@/components/Navbar/DashboardNavbar'
import { routing } from '@/i18n/routing'
import theme from '@/theme/theme'

import '@/globals.css'

export const metadata: Metadata = {
  robots: {
    index: false,
    googleBot: {
      index: false,
    },
  },
}

export default async function DashboardLayout({
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

  const messages = await getMessages()

  return (
    <ClerkProvider afterSignOutUrl={`/${locale}/dashboard`}>
      <html lang={locale}>
        <body
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <AppRouterCacheProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <NextIntlClientProvider messages={messages}>
                <DashboardNavbar />
                <Box component='main' sx={{ flexGrow: 1 }}>
                  {children}
                </Box>
                <Footer />
                <AnalyticsConsentProvider />
              </NextIntlClientProvider>
            </ThemeProvider>
          </AppRouterCacheProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
