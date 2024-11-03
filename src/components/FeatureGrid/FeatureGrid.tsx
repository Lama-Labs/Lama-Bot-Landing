import Grid from '@mui/material/Grid2'
import { Box, Card, Typography } from '@mui/material'
import FeatureCard from '@/components/FeatureGrid/FeatureCard'

const FeatureGrid = () => {
  return (
    <Box display='flex' maxWidth='xl' flexDirection='column' gap={6}>
      <Typography variant='h2' sx={{ alignSelf: 'center' }}>
        Features
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant='outlined'>
            <Typography variant='h3'>Feature 1</Typography>
            <Typography>Feature 1 description</Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant='outlined'>
            <Typography variant='h3'>Feature 2</Typography>
            <Typography>Feature 2 description</Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FeatureCard />
        </Grid>
      </Grid>
    </Box>
  )
}

export default FeatureGrid
