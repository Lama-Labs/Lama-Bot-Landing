import { AppBar, Container, Toolbar } from '@mui/material'

import NavbarMenu from '@/components/Navbar/NavbarMenu'

const Navbar = () => {
  return (
    <AppBar position='absolute'>
      <Container maxWidth='xl'>
        <Toolbar>
          <NavbarMenu />
        </Toolbar>
      </Container>
    </AppBar>
  )
}

export default Navbar
