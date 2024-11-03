'use client'
import { useState } from 'react'
import { Box, Button, IconButton } from '@mui/material'
import { Menu } from 'lucide-react'

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
        justifyContent: { xs: 'flex-end', sm: 'center' },
        width: '100%',
      }}
    >
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
    </Box>
  )
}

export default NavbarMenu
