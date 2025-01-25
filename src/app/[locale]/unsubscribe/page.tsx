import { Box } from '@mui/material'

import ContactForm from '@/components/ContactForm/ContactForm'

const Unsubscribe = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <ContactForm type={'unsubscribe'} />
    </Box>
  )
}

export default Unsubscribe
