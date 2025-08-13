'use client'
import { UserButton } from '@clerk/nextjs'
import { AppBar, Box, Container, Toolbar } from '@mui/material'
import Image from 'next/image'

const DashboardNavbar = () => {
  return (
    <AppBar position='absolute'>
      <Container maxWidth='xl'>
        <Toolbar>
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
            <Box>
              <UserButton />
            </Box>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

export default DashboardNavbar
