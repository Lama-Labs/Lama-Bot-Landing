'use client'

import { ClerkProvider, PricingTable } from '@clerk/nextjs'
import { Container, Skeleton, useTheme } from '@mui/material'
import { useLocale } from 'next-intl'

const PricingSection = () => {
  const theme = useTheme()
  const locale = useLocale()
  //const t = useTranslations('home.pricing')

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: theme.palette.primary.main,
        },
      }}
    >
      <Container maxWidth='xl' sx={{ width: '100%' }}>
        {/*<Paper
                    elevation={3}
                    sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2 }}
                >
                <Typography variant='h4' sx={{ mb: 2 }}>
                {t('title')}
            </Typography>*/}
        <PricingTable
          newSubscriptionRedirectUrl={`/${locale}/dashboard`}
          fallback={
            <Skeleton variant='rectangular' width={'100%'} height={225} />
          }
        />
        {/*</Paper>*/}
      </Container>
    </ClerkProvider>
  )
}

export default PricingSection
