'use client'
import { useState } from 'react'
import { Box, Button, IconButton } from '@mui/material'
import { Menu } from 'lucide-react'
import LocaleSwitcher from '@/components/LanguageSwitcher/LocaleSwitcher'
import Image from 'next/image'

const NavbarMenu = () => {
  const navItems = ['Home', 'About', 'Contact']

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
          border: '2px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '30px',
        }}
      >
        {navItems.map((item) => (
          <Button key={item}>{item}</Button>
        ))}
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
