import { Box, Container, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { useTranslations } from 'next-intl'

import FeatureCard from '@/components/FeatureGrid/FeatureCard'

const FeatureGrid = () => {
  const t = useTranslations('home.features')
  const items = t.raw('items')

  return (
    <Container maxWidth='xl'>
      <Box display='flex' maxWidth='xl' flexDirection='column' gap={6} pb={6}>
        <Typography variant='h2' sx={{ alignSelf: 'center' }}>
          {t('title')}
        </Typography>
        <Grid container spacing={3}>
          {/*todo: fix*/}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
          {items.map((feature: any, index: number) => (
            <Grid key={index} size={{ xs: 12, md: 4 }}>
              <FeatureCard
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  )
}

export default FeatureGrid
