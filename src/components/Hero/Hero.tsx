'use client'

import {
  Box,
  Container,
  Grid2,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
// import { sendGAEvent } from '@next/third-parties/google'
// import Cookies from 'js-cookie'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

// import { useChat } from '@/context/ChatContext'
import ChatField from '@/components/ChatBot/ChatField'
import EmailSubscription from '@/components/EmailSubscription/EmailSubscription'
import TextParser from '@/utils/TextParser'

const Hero = () => {
  const t = useTranslations('home')
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const isMediumScreen = useMediaQuery(theme.breakpoints.down('md'))
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const invisibleClone = useRef<HTMLDivElement>(null)
  const originalBox = useRef<HTMLDivElement>(null)
  const form = useRef<HTMLDivElement>(null)
  const [formHeight, setFormHeight] = useState<number>(35)

  // const { isChatOpen, setIsChatOpen } = useChat()

  useEffect(() => {
    // Initial gradient position
    if (invisibleClone.current && originalBox.current) {
      const x = window.innerWidth / (isMediumScreen ? 2 : 3)
      const y = window.innerHeight / 2
      invisibleClone.current.style.maskImage = `radial-gradient(circle 400px at ${x}px ${y}px, rgba(0,0,0,0.4) 0%, black 100%)`
    }

    if (isMediumScreen) return

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
  }, [isMediumScreen, isSmallScreen])

  useEffect(() => {
    if (!form.current) return

    const updateSize = () => {
      if (!form.current) return
      const rect = form.current.getBoundingClientRect()
      setFormHeight(rect.height)
    }

    updateSize()
    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(form.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  /*const scrollTo = (id: string) => {
    if (Cookies.get('analytics-consent') === 'true') {
      sendGAEvent({
        action: 'click',
        category: 'Button',
        label: 'CTA clicked',
        value: 'CTA',
      })
    }

    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }*/

  /*const openCTA = () => {
    if (Cookies.get('analytics-consent') === 'true') {
      sendGAEvent({
        action: 'click',
        category: 'Button',
        label: 'CTA clicked',
        value: 'CTA',
      })
    }
  }*/

  return (
    <>
      {/* Original*/}
      <Box
        id='home'
        ref={originalBox}
        sx={{
          position: 'relative',
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
          zIndex: 0,
        }}
      >
        <Container maxWidth='lg'>
          <Grid2 container spacing={4} alignItems='center'>
            <Grid2 size={{ xs: 12, md: 6 }}>
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
                variant='body2'
                sx={{
                  mb: 4,
                  color: 'white',
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
                }}
              >
                {t('hero.subtitle')}
              </Typography>
              <Box ref={form} sx={{ display: 'inline-flex', width: '100%' }}>
                <EmailSubscription displayMode='text' hideCaptchaNotice />
              </Box>
            </Grid2>
            {mounted && !isMediumScreen && (
              <Grid2 size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    height: { xs: '0', md: '70vh' },
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  <ChatField embedded />
                </Box>
              </Grid2>
            )}
          </Grid2>
        </Container>
        {/*  Invisible clone (overlay) inside hero for proper stacking */}
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
            zIndex: 1,
            background: 'black',
            '& .MuiButton-root': {
              boxShadow: '0 0 20px #A7A0F880',
              pointerEvents: 'auto',
            },
          }}
        >
          <Container maxWidth='lg'>
            <Grid2 container spacing={4} alignItems='center'>
              <Grid2 size={{ xs: 12, md: 6 }}>
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
                <Typography variant='body2' sx={{ mb: 4 }}>
                  {t('hero.subtitle')}
                </Typography>
                <Box sx={{ height: formHeight }} />
              </Grid2>
              {!isMediumScreen && (
                <Grid2 size={{ xs: 12, md: 6 }}>
                  {/* This column mirrors layout spacing for desktop visualization */}
                </Grid2>
              )}
            </Grid2>
          </Container>
        </Box>
      </Box>
    </>
  )
}

export default Hero
