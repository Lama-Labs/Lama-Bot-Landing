import { Box } from '@mui/material'
import Hero from '@/components/Hero/Hero'
import FeatureGrid from '@/components/FeatureGrid/FeatureGrid'
import Paragraphs from '@/components/Paragraphs/Paragraphs'
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
      <Paragraphs />
      <ContactForm />
    </Box>
  )
}

export default Home
