import { Box, Card, Typography } from '@mui/material'
import Image from 'next/image'

interface ParagraphProps {
  title: string
  description: string
  image: string
}
const Paragraph: React.FC<ParagraphProps> = ({ title, description, image }) => {
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
        <Typography variant='body1' color='primary' sx={{ pb: 2 }}>
          {title}
        </Typography>
        <Typography variant='h2'>{title}</Typography>
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
