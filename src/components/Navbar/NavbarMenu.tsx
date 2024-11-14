'use client'
import { Box, Button, IconButton } from '@mui/material'
import { Menu } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import LocaleSwitcher from '@/components/LanguageSwitcher/LocaleSwitcher'

const NavbarMenu = () => {
  const t = useTranslations('navbar')

  // todo: implement mobile drawer
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <Box width='200px'>
        <Image
          src='/lamashop logo.png'
          alt='Lama Logo'
          width={30}
          height={30}
        />
      </Box>
      <IconButton
        color='inherit'
        aria-label='open drawer'
        edge='start'
        onClick={handleDrawerToggle}
        sx={{ mr: 2, display: { sm: 'none' } }}
      >
        <Menu />
      </IconButton>
      <Box
        sx={{
          px: 4,
          py: 1,
          display: { xs: 'none', sm: 'flex' },
          gap: 1,
          background: 'black',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '30px',
          '&:hover': {
            boxShadow: '0 0 1px #A7A0F8',
            transition: 'box-shadow 0.25s ease-in-out',
          },
          '&:not(:hover)': {
            transition: 'box-shadow 0.5s ease-in-out',
          },
        }}
      >
        <Button
          variant='text'
          sx={{
            '&:hover': {
              backgroundColor: 'transparent',
              color: '#A7A0F8',
              textShadow: '0 0 5px #A7A0F8',
              transition: 'text-shadow 0.25s ease-in-out',
            },
            '&:not(:hover)': {
              transition: 'text-shadow 0.5s ease-in-out',
            },
          }}
        >
          {t('home')}
        </Button>
        <Button
          variant='text'
          sx={{
            '&:hover': {
              backgroundColor: 'transparent',
              color: '#A7A0F8',
              textShadow: '0 0 5px #A7A0F8',
              transition: 'text-shadow 0.25s ease-in-out',
            },
            '&:not(:hover)': {
              transition: 'text-shadow 0.h5s ease-in-out',
            },
          }}
        >
          {t('about')}
        </Button>
        <Button
          variant='text'
          sx={{
            '&:hover': {
              backgroundColor: 'transparent',
              color: '#A7A0F8',
              textShadow: '0 0 5px #A7A0F8',
              transition: 'text-shadow 0.25s ease-in-out',
            },
            '&:not(:hover)': {
              transition: 'text-shadow 0.h5s ease-in-out',
            },
          }}
        >
          {t('contact')}
        </Button>
      </Box>
      <Box
        sx={{
          display: { xs: 'none', sm: 'flex' },
        }}
      >
        <LocaleSwitcher />
      </Box>
    </Box>
  )
}

export default NavbarMenu
