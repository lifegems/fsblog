import Link from 'next/link';
import { Box, Card, CardBody, CardHeader, CardFooter } from 'grommet';

function Schedules(props) {
   const links = [
      {
         name: 'AV Schedule',
         description: 'Make assignments for Zoom Hosts and Media responsibilities',
         href: '/schedules/av'
      },
      {
         name: 'Midweek Meeting',
         description: 'Make assignments for Midweek Meetings',
         href: '/schedules/midweek'
      }
   ]
   return (
      <div>
         <h1 className="text-xl font-bold">Schedules</h1>
         <hr/>
         <Box direction="row">
            {links.map(app => (
               <Card className="p-5 m-3 w-60">
                  <CardHeader>
                     <Link href={app.href}>
                        <span className="mr-6 cursor-pointer text-blue-800">{app.name}</span>
                     </Link>
                  </CardHeader>
                  <CardBody>
                     <p>{app.description}</p>
                  </CardBody>
               </Card>
            ))}
         </Box>
      </div>
    )
 }
 
 export default Schedules