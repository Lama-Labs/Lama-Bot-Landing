'use client'
import { createTheme } from '@mui/material/styles'
import { Plus_Jakarta_Sans } from 'next/font/google'

export const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Helvetica', 'Arial', 'sans-serif'],
})

declare module '@mui/material/styles/createPalette' {
  interface Palette {
    chat: {
      background: string
      bubble: string
    }
  }
  interface PaletteOptions {
    chat: {
      background: string
      bubble: string
    }
  }
}

declare module '@mui/material/Alert' {
  interface AlertPropsColorOverrides {
    primary: true
  }
}

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
      default: '#000000',
    },
    text: {
      primary: '#ffffff',
    },
    chat: {
      background: '#1C1C1E',
      bubble: '#2C2C2E',
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
      color: '#ffffff',
    },
    h2: {
      fontWeight: 600,
      fontSize: '48px',
      color: '#ffffff',
    },
    h3: {
      fontWeight: 600,
      fontSize: '40px',
      color: '#ffffff',
    },
    h4: {
      fontWeight: 600,
      fontSize: '32px',
      color: '#ffffff',
    },
    h5: {
      fontWeight: 600,
      fontSize: '24px',
      color: '#ffffff',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      color: '#ffffff',
    },
    button: {
      fontWeight: 400,
    },
    body1: {
      fontWeight: 400,
      fontSize: '16px',
      color: '#8692a6',
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
    caption: {
      color: '#8692a6',
    },
  },
})

export default theme
