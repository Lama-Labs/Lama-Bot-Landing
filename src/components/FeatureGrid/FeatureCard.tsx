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
      sx={{
        textAlign: 'center',
        height: '100%',
        px: 6,
        py: 4,
        transition: 'filter 0.25s ease-in-out',
        '& .icon': {
          transition: 'filter 0.25s ease-in-out',
        },
        '&:hover': {
          filter: 'drop-shadow(0 0 5px #A7A0F866)',
          transition: 'filter 0.25s ease-in-out',
          '& .icon': {
            filter: 'drop-shadow(0 0 5px #A7A0F8)',
            transition: 'filter 0.25s ease-in-out',
          },
        },
        '&:not(:hover)': {
          transition: 'filter 0.5s ease-in-out',
          '& .icon': {
            transition: 'filter 0.5s ease-in-out',
          },
        },
      }}
    >
      <Box
        className='icon'
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
