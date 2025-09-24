'use client'

import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

const ArrowHint: React.FC = () => {
  const [isAtTop, setIsAtTop] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY === 0)
    }

    // Initialize on mount
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const t = useTranslations('arrowHint')

  return (
    <Box
      sx={{
        display: { xs: 'flex', md: 'none' },
        position: 'fixed',
        // Position the arrow to point toward the mobile FAB (typically bottom-right)
        // Adjusted to sit up and left from the FAB
        bottom: 40,
        right: 70,
        zIndex: 3,
        pointerEvents: 'none',
        transition: 'opacity 400ms ease',
        opacity: isAtTop ? 1 : 0,
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Typography
        variant='h6'
        color='white'
        sx={{
          transform: 'translateX(-70%)',
        }}
      >
        {t('label')}
      </Typography>
      <svg
        width='62'
        height='54'
        viewBox='8 12 62 54'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <marker
            id='arrowhead'
            viewBox='0 0 10 10'
            refX='9.8'
            refY='5'
            markerWidth='8'
            markerHeight='8'
            orient='auto'
            markerUnits='strokeWidth'
          >
            <path d='M 10 5 L 3 2' stroke='#FFFFFF' strokeLinecap='round' />
            <path d='M 10 5 L 3 8' stroke='#FFFFFF' strokeLinecap='round' />
          </marker>
        </defs>
        <path
          d='M10 14 C 14 34, 36 52, 68 66'
          stroke='#FFFFFF'
          strokeWidth={3}
          strokeLinecap='round'
          strokeLinejoin='round'
          markerEnd='url(#arrowhead)'
        />
      </svg>
    </Box>
  )
}

export default ArrowHint
