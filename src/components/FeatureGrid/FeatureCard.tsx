import { Box, Card, Typography } from '@mui/material'

import MapIcon from '@/utils/MapIcon'

interface FeatureCardProps {
  title: string
  description: string
  icon: string
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
}) => {
  return (
    <Card
      variant='outlined'
      className='animate animate-bottom duration-1s'
      sx={{
        textAlign: 'center',
        px: 6,
        py: 4,
        '&:hover': {
          boxShadow: '0px 2px 5px #A7A0F8',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: 48,
          height: 48,
          margin: '0 auto 16px',
        }}
      >
        <MapIcon iconName={icon} color='#A7A0F8' size={24} />
      </Box>
      <Typography variant='h6' component='h2' gutterBottom>
        {title}
      </Typography>
      <Typography variant='body1'>{description}</Typography>
    </Card>
  )
}

export default FeatureCard
