import Link from "next/link";
import { useState, useEffect, useContext } from "react"
import { Box, Button, Card, CardBody, CardFooter, CardHeader, DateInput, Grid, List, ResponsiveContext, Select, Table, TableBody, TableHeader, TableRow, TableCell, Text, TextInput } from "grommet"
import moment from "moment"
import { Add, FastForward, FormDown, FormNext, FormView, Hide, Trash } from "grommet-icons"
import { supabase } from "../../api"

function getDefaultDate(){
   var now = new Date();
   var day = ("0" + now.getDate()).slice(-2);
   var month = ("0" + (now.getMonth() + 1)).slice(-2);
   var today = now.getFullYear()+"-"+(month)+"-"+(day);

   return today;
}

export default function AV() {
   const size = useContext(ResponsiveContext);
   const [schedules, setSchedules] = useState([])
   const [publishers, setPublishers] = useState([])

   const [months, setMonths] = useState([
      moment().format("MMMM YYYY"),
      moment().add(1, 'month').format("MMMM YYYY"),
      moment().add(2, 'month').format("MMMM YYYY"),
      moment().add(3, 'month').format("MMMM YYYY"),
      moment().add(4, 'month').format("MMMM YYYY"),
      moment().add(5, 'month').format("MMMM YYYY")
   ])
   const [selectedMonth, setMonth] = useState(0)

   const [showDates, setShowDates] = useState(false)

   useEffect(() => {
      fetchPublishers()
      fetchSchedules()
   }, [])

   async function fetchPublishers() {
      const { data } = await supabase.from("publisher").select("*,privilege(*)")
      data.sort((a,b) => {
         if (a.last_name < b.last_name) return -1
         if (a.last_name > b.last_name) return 1
         return 0
      })
      setPublishers(data)
   }

   async function fetchSchedules() {
      const { data } = await supabase.from("schedule").select("*,schedule_type(*),schedule_av(*,av_host_id(*),av_media_id(*))")
      data.sort((a,b) => {
         if (a.event_date > b.event_date) return 1
         if (a.event_date < b.event_date) return -1
         return 0
      })
      setSchedules(data)
   }

   async function createSchedule() {
      const response = await supabase.from("schedule_av").insert({}).single()
      const schedule = {
         event_date: moment(months[selectedMonth], 'MMMM YYYY').clone().endOf('month').format('YYYY-MM-DD'),
         type_id: 1,
         schedule_id: response.body.id
      }
      await supabase.from("schedule").insert(schedule).single()
      fetchSchedules()
   }

   async function deleteSchedule(scheduleId, avId) {
      await supabase.from("schedule").delete().match({ id: scheduleId })
      await supabase.from("schedule_av").delete().match({ id: avId })
      fetchSchedules()
   }

   async function updateScheduleDate(id, date) {
      await supabase.from("schedule").update({event_date:date}).match({ id })
      fetchSchedules()
   }

   async function updateScheduleHost(id, host) {
      await supabase.from("schedule_av").update({av_host_id:host.id}).match({ id })
      fetchSchedules()
   }

   async function updateScheduleMedia(id, media) {
      await supabase.from("schedule_av").update({av_media_id:media.id}).match({ id })
      fetchSchedules()
   }

   function addMonth() {
      setMonths([
         ...months,
         moment().add(months.length, 'month').format("MMMM YYYY")
      ])
   }

   function autoAssign() {
      let current = schedules.filter(s => moment(s.event_date).isSame(moment(months[selectedMonth], 'MMMM YYYY'), 'month'))
      current.map(async s => {
         let randomHost  = publishers[Math.floor(Math.random() * publishers.length)]
         let randomMedia = publishers[Math.floor(Math.random() * publishers.length)]
         await supabase.from("schedule_av").update({av_host_id: randomHost.id, av_media_id: randomMedia.id}).match({ id: s.schedule_av.id })
      })
      setTimeout(() => fetchSchedules(), 1000)
   }

  if (!schedules || !publishers) return (<div>Loading...</div>)
  return (
   <div>
     <h1 className="text-3xl font-semibold tracking-wide mt-6 mb-2">
       AV Schedule
     </h1>
     <div>
       {size == 'small' &&
         <div className="pt-3 pb-5">
           <Button onClick={() => setShowDates(!showDates)}>
             {showDates && <FormDown />} 
             {!showDates && <FormNext />} 
             Months
           </Button>
         </div>
       }
     </div>
     <Grid responsive={true} areas={size != 'small' ? [
         { name: 'nav', start: [0, 0], end: [0, 0] },
         { name: 'main', start: [1, 0], end: [1, 0] },
       ] : [['nav'],['main']]} columns={size != 'small' ? ['medium', 'flex'] : ['100%','100%']} rows={['flex']} gap="medium">
       {(size != 'small' || showDates) &&
         <Box gridArea="nav">
           <List data={months} onClickItem={({datum,index}) => {setMonth(index); setShowDates(false)}} itemProps={
             {[selectedMonth]: { background: 'brand' }} }/>
           <input type="submit" value="+ New Month" onClick={addMonth} className="border p-2 mt-4 hover:bg-green-100 cursor-pointer" />
         </Box>
       }
       <Box gridArea="main" className={size != 'small' ? "p-5" : ''}>
         {size != 'small' &&
         <Card>
            <CardHeader pad="small">
               <Box fill responsive={true} justify="between" direction="row">
                  <Text className="font-bold text-xl">{months[selectedMonth]}</Text>
                  <Button onClick={autoAssign}>
                     <Box direction="row">
                        <Text className="font-bold text-xl pr-2">Auto Assign</Text>
                        <FastForward />
                     </Box>
                  </Button>
               </Box>
            </CardHeader>
            <CardBody pad="small">
               <Grid>
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableCell>Date</TableCell>
                           <TableCell>Host</TableCell>
                           <TableCell>Media</TableCell>
                           <TableCell>Actions</TableCell>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {schedules.filter(s => moment(s.event_date).isSame(moment(months[selectedMonth], 'MMMM YYYY'), 'month')).map((schedule, index) => (
                           <TableRow key={schedule.id}>
                              <TableCell>
                                 <DateInput format="mm/dd/yyyy" value={moment(schedule.event_date).toISOString()} onChange={(e) => updateScheduleDate(schedule.id, e.value)}></DateInput>
                              </TableCell>
                              <TableCell>
                                 <Select options={publishers} defaultValue={schedule.schedule_av.av_host_id} value={schedule.schedule_av.av_host_id || 0} valueKey="id" labelKey={p => `${p.last_name}, ${p.first_name}`} onChange={(e) => updateScheduleHost(schedule.schedule_av.id, e.value)} />
                              </TableCell>
                              <TableCell>
                                 <Select options={publishers} defaultValue={schedule.schedule_av.av_media_id} value={schedule.schedule_av.av_media_id || 0} valueKey="id" labelKey={p => `${p.last_name}, ${p.first_name}`} onChange={(e) => updateScheduleMedia(schedule.schedule_av.id, e.value)} />
                              </TableCell>
                              <TableCell>
                              <Button hoverIndicator="light-2" onClick={() => deleteSchedule(schedule.id, schedule.schedule_av.id)}>
                                 <Trash/>
                              </Button>
                              </TableCell>
                           </TableRow>
                        ))}
                        <TableRow>
                           <TableCell>
                              <Button hoverIndicator="light-2" onClick={createSchedule}>
                                 <Box pad="small" direction="row" align="center" gap="small">
                                    <Add/>
                                    <Text>Week</Text>
                                 </Box>
                              </Button>
                           </TableCell>
                           <TableCell></TableCell>
                           <TableCell></TableCell>
                        </TableRow>
                     </TableBody>
                  </Table>
               </Grid>
            </CardBody>
            <CardFooter pad="medium" justify="start">
            </CardFooter>
         </Card>
         }
         {size == 'small' &&
            <>
               <Text className="p-3 font-bold text-xl">{months[selectedMonth]}</Text>
               {schedules.filter(s => moment(s.event_date).isSame(moment(months[selectedMonth], 'MMMM YYYY'), 'month')).map((schedule,index) => (<Card pad="medium" margin="medium" key={index}>
                  <CardHeader>
                     <Box direction="column">
                        <Text>Date</Text>
                        <DateInput format="mm/dd/yyyy" value={schedule.event_date} onChange={(e) => updateScheduleDate(schedule.id, e.value)}></DateInput>
                     </Box>
                  </CardHeader>
                  <CardBody>
                     <Text className="mt-3">Host</Text>
                     <Select options={publishers} defaultValue={schedule.schedule_av.av_host_id} value={schedule.schedule_av.av_host_id || 0} valueKey="id" labelKey={p => `${p.last_name}, ${p.first_name}`} onChange={(e) => updateScheduleHost(schedule.schedule_av.id, e.value)} />
                     <Text className="mt-3">Media</Text>
                     <Select options={publishers} defaultValue={schedule.schedule_av.av_media_id} value={schedule.schedule_av.av_media_id || 0} valueKey="id" labelKey={p => `${p.last_name}, ${p.first_name}`} onChange={(e) => updateScheduleMedia(schedule.schedule_av.id, e.value)} />
                  </CardBody>
               </Card>))}
               <Box align="center" pad="medium">
                  <Button hoverIndicator="light-2" onClick={createSchedule}>
                     <Box pad="small" direction="row" align="center" gap="small">
                        <Add/>
                        <Text>Week</Text>
                     </Box>
                  </Button>
               </Box>
            </>
         }
       </Box>
     </Grid>
   </div>
 );
}