import { Box } from '@mui/material'

import ContactForm from '@/components/ContactForm/ContactForm'
import FeatureGrid from '@/components/FeatureGrid/FeatureGrid'
import Hero from '@/components/Hero/Hero'
import Paragraphs from '@/components/Paragraphs/Paragraphs'

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
