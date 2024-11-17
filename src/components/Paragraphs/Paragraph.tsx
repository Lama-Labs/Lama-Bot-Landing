import { Box, Card, Typography } from '@mui/material'
import Image from 'next/image'

import MapIcon from '@/utils/MapIcon'

interface ParagraphProps {
  pretitle: string
  title: string
  description: string
  image: string
  icon: string
}
const Paragraph: React.FC<ParagraphProps> = ({
  pretitle,
  title,
  description,
  image,
  icon,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 4,
      }}
    >
      <Box
        className='animate animate-left'
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'start',
          gap: 2,
          width: { xs: '100%', md: '50%' },
        }}
      >
        <Box display='flex' gap={1} alignItems='center'>
          <MapIcon iconName={icon} color='#A7A0F8' size={16} />
          <Typography variant='body1' color='primary'>
            {pretitle}
          </Typography>
        </Box>
        <Typography variant='h2' sx={{ pt: 2 }}>
          {title}
        </Typography>
        <Typography variant='body1'>{description}</Typography>
      </Box>
      <Box
        className='animate animate-right delay-250'
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Card variant='outlined' sx={{ p: 4, width: '100%' }}>
          <Image src={image} alt='Car' width={400} height={300} />
        </Card>
      </Box>
    </Box>
  )
}

export default Paragraph
