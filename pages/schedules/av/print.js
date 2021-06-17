import Link from "next/link";
import { useRouter } from "next/router";
import moment from 'moment'
import { jsPDF } from "jspdf";
import { useState, useEffect } from "react"
import { supabase } from "../../../api"
import { Box, Button, DateInput, Text, Select, Table, TableBody, TableCell, TableHeader, TableRow } from 'grommet'
import { DocumentPdf, Print } from 'grommet-icons'

function getDefaultDate(){
   var now = new Date();
   var day = ("0" + now.getDate()).slice(-2);
   var month = ("0" + (now.getMonth() + 1)).slice(-2);
   var today = now.getFullYear()+"-"+(month)+"-"+(day);

   return today;
}

export default function PrintSchedule() {
   const [schedule, setSchedule] = useState(null)
   const [title, setTitle] = useState("")

   const router = useRouter()
   const { from, to } = router.query
 
   useEffect(() => {
     fetchSchedule()
     async function fetchSchedule() {
       if (!from && !to) return console.log('No dates specified')
       const { data } = await supabase
         .from('schedule')
         .select("*,schedule_type(*),schedule_av(*,av_host_id(*),av_media_id(*))")
         .gte('event_date', from)
         .lte('event_date', to)
       setSchedule(data)
       updateTitle()
     }
   }, [from, to])

   function updateTitle() {
      let firstMonth = moment(from).format('MMMM')
      let firstYear = moment(from).format('YYYY')
      let lastMonth = moment(to).format('MMMM')
      let lastYear = moment(to).format('YYYY')
      if (firstMonth == lastMonth && firstYear == lastYear) {
         // June 2021
         setTitle(`${firstMonth} ${firstYear}`)
      } else if (firstMonth != lastMonth && firstYear == lastYear) {
         // June-July 2021
         setTitle(`${firstMonth}-${lastMonth} ${firstYear}`)
      } else {
         // December 2021-January 2022
         setTitle(`${firstMonth} ${firstYear}-${lastMonth} ${lastYear}`)
      }
   }

   function updateFromDate(date) {
      let from = moment(date.value).format('MM-DD-YYYY')
      router.push({
         pathname: '/schedules/av/print',
         query: { from, to }
      })
   }
   
   function updateToDate(date) {
      let to = moment(date.value).format('MM-DD-YYYY')
      router.push({
         pathname: '/schedules/av/print',
         query: { from, to }
      })
   }

   function savePDF() {
      let pdf = new jsPDF();
      pdf.save();
   }

   if (!schedule) return (<p>Loading...</p>)
   return (
      <>
         <div className="print:hidden cursor-pointer">
            <span className="text-blue-800">
               <Link href="/schedules/av">&lt; Schedules</Link>
            </span>
            <Box direction="row" className="mt-3 mb-5">
               <Box className="mr-5">
                  <Text>From</Text>
                  <DateInput format="mm-dd-yyyy" value={moment(from).toISOString()} onChange={updateFromDate} />
               </Box>
               <Box>
                  <Text>To</Text>
                  <DateInput format="mm-dd-yyyy" value={moment(to).toISOString()} onChange={updateToDate} />
               </Box>
            </Box>
            <Box direction="row" className="mt-3 mb-5">
               {/* <Box className="ml-5">
                  <Button onClick={savePDF}>
                     <Box direction="row">
                        <DocumentPdf />
                        <Text className="ml-2">PDF</Text>
                     </Box>
                  </Button>
               </Box> */}
               <Box className="ml-5">
                  <Button onClick={print}>
                     <Box direction="row">
                        <Print />
                        <Text className="ml-2">Print</Text>
                     </Box>
                  </Button>
               </Box>
            </Box>
         </div>
         <h3 className="font-bold text-2xl text-center">AV Schedule</h3>
         <h3 className="font-bold text-l pb-3 text-center">{title}</h3>
         <Table>
            <TableHeader>
               <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Host</TableCell>
                  <TableCell>Media</TableCell>
               </TableRow>
            </TableHeader>
            <TableBody>
               {schedule.map(s => (
                  <TableRow key={s.id}>
                     <TableCell>{moment(s.event_date).format("MMMM DD")}</TableCell>
                     <TableCell>{s.schedule_av.av_host_id.first_name} {s.schedule_av.av_host_id.last_name}</TableCell>
                     <TableCell>{s.schedule_av.av_media_id.first_name} {s.schedule_av.av_media_id.last_name}</TableCell>
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </>
   )
}