'use client'

import { Box, Card, Container, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import EmailSubscription from '@/components/EmailSubscription/EmailSubscription'
//import PricingSection from '@/components/Pricing/PricingSection'

interface FormProps {
  type?: 'contact' | 'unsubscribe'
}

const ContactForm = ({ type = 'contact' }: FormProps) => {
  const t = useTranslations(type === 'contact' ? 'home.cta' : 'unsubscribe')

  return (
    <Container maxWidth='xl' id='contact'>
      <Box
        className={type === 'contact' ? 'animate animate-bottom' : undefined}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          mb: 6,
        }}
      >
        <Card
          variant='outlined'
          sx={{
            width: '100%',
            px: 4,
            justifyItems: 'center',
            '&:hover': {
              boxShadow: '0px 2px 10px #A7A0F866',
            },
          }}
        >
          <Typography variant='h2' textAlign='center' sx={{ pt: 8 }}>
            {t('title')}
          </Typography>
          <Box
            display='flex'
            flexDirection={{ xs: 'column', md: 'row' }}
            gap={6}
            sx={{ pt: 4, pb: 16 }}
          >
            {/*<Box flex={1} minWidth={0} sx={{ alignContent: 'center', my: 4 }}>
              <PricingSection />
            </Box>
            <Divider
              orientation={isMdUp ? 'vertical' : 'horizontal'}
              flexItem
            />*/}
            <Box
              display='flex'
              flexDirection='column'
              justifyContent='center'
              gap={5}
              flex={1}
              maxWidth='sm'
            >
              <Box
                display='flex'
                flexDirection='column'
                gap={0.5}
                sx={{ width: '100%' }}
              >
                <Typography variant='body1' align='left' sx={{ mb: 3 }}>
                  {t('subtitle')}
                </Typography>
                <EmailSubscription displayMode='icon' />
              </Box>
            </Box>
          </Box>
        </Card>
      </Box>
    </Container>
  )
}

export default ContactForm
