import { Box, Card, Container, Typography } from '@mui/material'
import Image from 'next/image'

const Paragraph = () => {
  return (
    <Container maxWidth='xl'>
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
          <Typography variant='h4'>Text</Typography>
          <Typography variant='body1'>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras nec
            urna eget urna aliquet luctus. Suspendisse potenti. Nullam nec nibh
            nec libero ultricies tincidunt. Curabitur nec sollicitudin nunc.
            Nullam nec nibh nec libero ultricies tincidunt. Curabitur nec
            sollicitudin nunc.
          </Typography>
        </Box>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'end',
          }}
        >
          <Card variant='outlined'>
            <Image
              src='/matte-background.png'
              alt='Car'
              width={400}
              height={300}
            />
          </Card>
        </Box>
      </Box>
    </Container>
  )
}

export default Paragraph
