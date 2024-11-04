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
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Typography variant='h4'>{title}</Typography>
        <Typography variant='body1'>{description}</Typography>
      </Box>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'end',
        }}
      >
        <Card variant='outlined'>
          <Image src={image} alt='Car' width={400} height={300} />
        </Card>
      </Box>
    </Box>
  )
}

export default Paragraph
