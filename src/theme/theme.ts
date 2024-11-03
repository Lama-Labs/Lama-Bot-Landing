'use client'
import { createTheme } from '@mui/material/styles'
import { Plus_Jakarta_Sans } from 'next/font/google'

export const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Helvetica', 'Arial', 'sans-serif'],
})

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#A7A0F8',
    },
    secondary: {
      main: '#F7931A',
    },
    background: {
      default: '#0E0D0D',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'transparent',
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          '&.MuiPaper-outlined': {
            border: '2px solid 8692A6',
            borderRadius: '8px',
          },
        },
      },
    },
  },
  typography: {
    fontFamily: plusJakartaSans.style.fontFamily,
    h1: {
      fontWeight: 600,
      fontSize: '58px',
    },
    h2: {
      fontWeight: 600,
      fontSize: '48px',
    },
    h3: {
      fontWeight: 600,
      fontSize: '40px',
    },
    h4: {
      fontWeight: 600,
      fontSize: '32px',
    },
    h5: {
      fontWeight: 600,
      fontSize: '24px',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    button: {
      fontWeight: 400,
    },
    body1: {
      fontWeight: 400,
    },
    body2: {
      fontWeight: 400,
    },
    subtitle1: {
      fontWeight: 400,
    },
    subtitle2: {
      fontWeight: 400,
    },
  },
})

export default theme
