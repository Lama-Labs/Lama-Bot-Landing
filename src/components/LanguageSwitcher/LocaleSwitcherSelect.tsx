'use client'

import { Box, IconButton, Menu, MenuItem } from '@mui/material'
import type { MenuProps } from '@mui/material/Menu'
import { ChevronDown, Languages } from 'lucide-react'
import { useState, useTransition } from 'react'

import { usePathname, useRouter } from '@/i18n/routing'

type LocaleOption = {
  value: string
  label: string
}

type LocaleSwitcherSelectProps = {
  currentLocale: string
  locales: LocaleOption[]
  anchorOrigin: MenuProps['anchorOrigin'];
  transformOrigin: MenuProps['transformOrigin'];
}

const LocaleSwitcherSelect = ({
  currentLocale,
  locales,
  anchorOrigin,
  transformOrigin,
}: LocaleSwitcherSelectProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [isPending, startTransition] = useTransition()
  const isMenuOpen = Boolean(anchorEl)

  const handleButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLocaleChange = (value: string) => {
    startTransition(() => {
      router.replace({ pathname }, { locale: value })
    })
    setAnchorEl(null)
  }

  const sortedLocales = [
    ...locales.filter((locale) => locale.value === currentLocale),
    ...locales.filter((locale) => locale.value !== currentLocale),
  ]

  return (
    <Box>
      <IconButton
        onClick={handleButtonClick}
        disabled={isPending}
        disableRipple
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: '#A7A0F8',
          '&:hover': {
            '& svg': {
              color: 'white',
              filter: 'drop-shadow(0 0 1px white)',
              transition:
                'text-shadow 0.25s ease-in-out, color 0.25s ease-in-out',
            },
          },
          '& svg': {
            transition: 'text-shadow 0.5s ease-in-out, color 0.5s ease-in-out',
          },
        }}
      >
        <Languages />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            transition: 'transform 0.25s',
            transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <ChevronDown />
        </Box>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
        disableScrollLock={true}
        sx={{
          mt: 1,
          position: 'absolute',
          '& .MuiPaper-root': {
            position: 'absolute',
          },
        }}
      >
        {sortedLocales.map(({ value, label }) => (
          <MenuItem
            key={value}
            selected={value === currentLocale}
            onClick={() => handleLocaleChange(value)}
            sx={{
              color: 'white',
              backgroundColor: 'transparent',
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                color: '#A7A0F8',
              },
            }}
          >
            {label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}

export default LocaleSwitcherSelect
