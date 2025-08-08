import { Container, Divider, Typography } from '@mui/material'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer>
      <Container maxWidth='xl'>
        <Divider variant='middle' />
        <Typography variant='body1' align='center' sx={{ py: 3 }}>
          © {currentYear} Lama Labs
        </Typography>
      </Container>
    </footer>
  )
}

export default Footer
