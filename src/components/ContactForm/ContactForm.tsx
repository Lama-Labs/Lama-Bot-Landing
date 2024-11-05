import {
  Box,
  Button,
  Card,
  Container,
  TextField,
  Typography,
} from '@mui/material'
import { Send } from 'lucide-react'
import { useTranslations } from 'next-intl'

const ContactForm = () => {
  const t = useTranslations('home.cta')

  return (
    <Container maxWidth='xl'>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          mb: 6,
        }}
      >
        <Card
          variant='outlined'
          sx={{
            width: '100%',
            px: 4,
            justifyItems: 'center',
            '&:hover': {
              boxShadow: '0px 2px 5px #A7A0F8',
            },
          }}
        >
          <Box
            display='flex'
            flexDirection='column'
            maxWidth='sm'
            gap={5}
            sx={{ pt: 8, pb: 20 }}
          >
            <Typography variant='h1'>{t('title')}</Typography>
            <Typography variant='body1'>{t('subtitle')}</Typography>
            <Box
              component='form'
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                gap: 2,
                pt: 2,
              }}
            >
              <TextField
                label='Email'
                type='email'
                variant='outlined'
                fullWidth
                size='small'
              />
              <Button type='submit' variant='contained' color='primary'>
                <Send />
              </Button>
            </Box>
          </Box>
        </Card>
      </Box>
    </Container>
  )
}

export default ContactForm
