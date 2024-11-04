import { Box, Container } from '@mui/material'
import Hero from '@/components/Hero/Hero'
import FeatureGrid from '@/components/FeatureGrid/FeatureGrid'
import Paragraph from '@/components/Paragraph/Paragraph'
import ContactForm from '@/components/ContactForm/ContactForm'

const Home = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <Hero />
      <FeatureGrid />
      <Paragraph />
      <Paragraph />
      <ContactForm />
    </Box>
  )
}

export default Home
