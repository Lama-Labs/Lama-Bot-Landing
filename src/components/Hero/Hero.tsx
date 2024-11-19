'use client'

import {
  Box,
  Button,
  Container,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { sendGAEvent } from '@next/third-parties/google'
import { useTranslations } from 'next-intl'
import { useEffect, useRef } from 'react'

import TextParser from '@/utils/TextParser'

const Hero = () => {
  const t = useTranslations('home')
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const invisibleClone = useRef<HTMLDivElement>(null)
  const originalBox = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Initial gradient position
    if (invisibleClone.current && originalBox.current && button.current) {
      let x, y
      if (isSmallScreen) {
        x = window.innerWidth / 2
        y = window.innerHeight / 2
      } else {
        const rect = button.current.getBoundingClientRect()
        x = rect.left + rect.width / 2
        y = rect.top + rect.height / 2
      }
      invisibleClone.current.style.maskImage = `radial-gradient(circle 400px at ${x}px ${y}px, rgba(0,0,0,0.4) 0%, black 100%)`
    }

    if (isSmallScreen) return

    const handlePointerMove = (e: PointerEvent) => {
      if (invisibleClone.current && originalBox.current) {
        const { clientX, clientY } = e
        const rect = originalBox.current.getBoundingClientRect()
        const x = clientX - rect.left
        const y = clientY - rect.top
        invisibleClone.current.style.maskImage = `radial-gradient(circle 300px at ${x}px ${y}px, transparent 0%, black 100%)`
      }
    }

    document.body.addEventListener('pointermove', handlePointerMove)

    return () => {
      document.body.removeEventListener('pointermove', handlePointerMove)
    }
  }, [isSmallScreen])

  const scrollTo = (id: string) => {
    sendGAEvent({
      action: 'click',
      category: 'Button',
      label: 'CTA clicked',
      value: 'CTA',
    })
    
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <>
      {/* Original*/}
      <Box
        id='home'
        ref={originalBox}
        sx={{
          height: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          backgroundImage:
            'linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 75%, rgba(0, 0, 0, 1) 95%), url(/pattern.svg)',
          backgroundRepeat: 'no-repeat, repeat',
          backgroundSize: 'cover, 800px 800px',
          backgroundPosition: 'center, center',
          zIndex: -1,
        }}
      >
        <Container maxWidth='md'>
          <Typography
            variant='h1'
            sx={{
              fontSize: { xs: '2.5rem', md: '4rem' },
              mb: 2,
              textShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
              '& strong': {
                fontWeight: 'bold',
                color: { xs: '#A7A0F8', md: 'white' },
              },
            }}
          >
            <TextParser text={t('hero.title')} />
          </Typography>
          <Typography
            variant='body1'
            sx={{
              mb: 4,
              color: 'white',
              textShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
            }}
          >
            {t('hero.subtitle')}
          </Typography>
          <Button
            ref={button}
            variant='contained'
            color='primary'
            size='large'
            sx={{ color: 'white' }}
          >
            {t('hero.cta')}
          </Button>
        </Container>
      </Box>
      {/*  Invisible clone*/}
      <Box
        ref={invisibleClone}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          select: 'none',
          pointerEvents: 'none',
          background: 'black',
          '& .MuiButton-root': {
            boxShadow: '0 0 20px #A7A0F880',
            pointerEvents: 'auto',
          },
        }}
      >
        <Container maxWidth='md'>
          <Typography
            variant='h1'
            sx={{
              fontSize: { xs: '2.5rem', md: '4rem' },
              mb: 2,
              '& strong': {
                fontWeight: 'bold',
                color: '#A7A0F8',
              },
            }}
          >
            <TextParser text={t('hero.title')} />
          </Typography>
          <Typography variant='body1' sx={{ mb: 4 }}>
            {t('hero.subtitle')}
          </Typography>
          <Button variant='outlined' color='primary' size='large' onClick={() => scrollTo('contact')}>
            {t('hero.cta')}
          </Button>
        </Container>
      </Box>
    </>
  )
}

export default Hero
