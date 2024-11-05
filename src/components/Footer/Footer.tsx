import { Container, Divider, Typography } from '@mui/material'

const Footer = () => {
  return (
    <footer>
      <Container maxWidth='xl'>
        <Divider variant='middle' />
        <Typography variant='body1' align='center' sx={{ py: 3 }}>
          © {new Date().getFullYear()} Lama Bot
        </Typography>
      </Container>
    </footer>
  )
}

export default Footer
