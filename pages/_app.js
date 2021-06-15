import Link from 'next/link'
import { Box, Button, Grid, Grommet, Nav, Text } from 'grommet';
import { deepMerge } from 'grommet/utils';
import { Briefcase, Menu } from 'grommet-icons'
import { useState, useEffect } from 'react'
import { supabase } from '../api'
import Head from 'next/head'
import '../styles/globals.css'
import { grommet } from 'grommet/themes'

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null)
  const [sidebar, setSidebar] = useState(false)

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async () => checkUser()
    )
    checkUser()
    return () => {
      authListener?.unsubscribe()
    };
  }, [])

  async function checkUser() {
    const user = supabase.auth.user()
    setUser(user)
  }

  const routes = [
    { name: 'Publishers', link: '/publishers', auth: () => user, children: [] },
    { name: 'Schedules', link: '/schedules', auth: () => user, children: [] },
    { name: 'Administration', link: '/admin', auth: () => user, children: [] },
    { name: 'Profile', link: '/profile', auth: () => true, children: [] },
  ]

  const customTheme = deepMerge(grommet, {
    
  });

  return (
  <Grommet full theme={customTheme}>
    <Head>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
    </Head>
    <Grid
        fill responsive={true}
        rows={['auto', 'flex']}
        columns={['auto', 'flex']}
        areas={[
          { name: 'header', start: [0, 0], end: [1, 0] },
          { name: 'sidebar', start: [0, 1], end: [0, 1] },
          { name: 'main', start: [1, 1], end: [1, 1] },
        ]}>
        <Box responsive={true}
          gridArea="header"
          direction="row"
          align="center"
          justify="between"
          pad={{ horizontal: 'medium', vertical: 'small' }}
          background="dark-2"
        >
          <Button onClick={() => setSidebar(!sidebar)}>
            <Menu />
          </Button>
          <Box direction="row">
            <Briefcase />
            <Text className="ml-2" size="large">Briefcase</Text>
          </Box>
        </Box>
      {sidebar && (
        <Box
          gridArea="sidebar"
          background="dark-3"
          width="small"
          animation={[
            { type: 'fadeIn', duration: 300 },
            { type: 'slideRight', size: 'xlarge', duration: 150 },
          ]}
        >
          {routes.map((route) => (
            <Button key={route.name} href={route.link} hoverIndicator>
              <Box pad={{ horizontal: 'medium', vertical: 'small' }}>
                <Text>{route.name}</Text>
              </Box>
            </Button>
          ))}
        </Box>
      )}
      <Box gridArea="main"className="p-10" >
        <Component {...pageProps} />
      </Box>
    </Grid>
  </Grommet>
  )
}

export default MyApp