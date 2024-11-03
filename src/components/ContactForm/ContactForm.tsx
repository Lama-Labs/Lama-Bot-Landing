import { Box, Button, TextField, Typography } from '@mui/material'

const ContactForm = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        maxWidth: 400,
        margin: 'auto',
        textAlign: 'center',
        mb: 6,
      }}
    >
      <Typography variant='h5'>Request a Demo</Typography>
      <Typography variant='body1'>
        Enter your email address and we will contact you...
      </Typography>
      <Box
        component='form'
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          width: '100%',
        }}
      >
        <TextField label='Email' type='email' variant='outlined' fullWidth />
        <Button type='submit' variant='contained' color='primary'>
          Send
        </Button>
      </Box>
    </Box>
  )
}

export default ContactForm
