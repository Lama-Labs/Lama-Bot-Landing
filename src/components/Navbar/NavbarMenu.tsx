'use client'
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material'
import { Menu } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import LocaleSwitcher from '@/components/LanguageSwitcher/LocaleSwitcher'

const NavbarMenu = () => {
  const t = useTranslations('navbar')

  const [mobileOpen, setMobileOpen] = useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState)
  }

  const scrollTo = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Box>
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
          sx={{ display: { sm: 'none' } }}
        >
          <Menu />
        </IconButton>
        <Box
          sx={{
            margin: 'auto',
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
          {['home', 'about', 'contact'].map((label, index) => (
            <Button
              key={index}
              variant='text'
              sx={{
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: 'white',
                  textShadow: '0 0 5px white',
                  transition:
                    'text-shadow 0.25s ease-in-out, color 0.25s ease-in-out',
                },
                '&:not(:hover)': {
                  transition:
                    'text-shadow 0.5s ease-in-out, color 0.5s ease-in-out',
                },
              }}
              onClick={() => scrollTo(label)}
            >
              {t(label)}
            </Button>
          ))}
        </Box>
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
          }}
        >
          <LocaleSwitcher
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
          />
        </Box>
      </Box>
      <Drawer
        open={mobileOpen}
        anchor={'right'}
        onClose={() => setMobileOpen(false)}
        disableRestoreFocus={true}
      >
        <Box sx={{ width: '60vw' }}>
          <List>
            {['home', 'about', 'contact'].map((label) => (
              <ListItem key={label} disablePadding>
                <ListItemButton onClick={() => scrollTo(label)}>
                  <ListItemText primary={t(label)} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <Box sx={{ mx: 1, my: 2 }}>
            <LocaleSwitcher
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
            />
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default NavbarMenu
