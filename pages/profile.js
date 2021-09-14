import { Auth, Typography, Button } from "@supabase/ui";
import { Box, Card, CardBody, CardFooter, CardHeader, DateInput, Grid, Row } from "grommet";
const { Text } = Typography
import { supabase } from '../api'

function Profile(props) {
    const { user } = Auth.useUser();
    if (user)
      return (
        <>
          <Grid className="w-52">
            <Text>Signed in: {user.email}</Text>
            <Button block onClick={() => props.supabaseClient.auth.signOut()}>
              Sign out
            </Button>
          </Grid>
        </>
      );
    return props.children 
}

export default function AuthProfile() {
    return (
        <Auth.UserContextProvider supabaseClient={supabase}>
          <Profile supabaseClient={supabase}>
            <Auth supabaseClient={supabase} providers={['google']} socialColors={true} />
          </Profile>
        </Auth.UserContextProvider>
    )
}