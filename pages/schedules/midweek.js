import Link from "next/link";
import { useState, useEffect, useContext } from "react";
import { Box, Button, Card, CardBody, CardFooter, CardHeader, DateInput, Grid, ResponsiveContext, Select, Table, TableBody, TableHeader, TableRow, TableCell, Text } from "grommet";
import moment from "moment";
import axios from "axios";
import { Add, Alarm, Clock, Cycle, FormDown, FormNext, Print, Trash } from "grommet-icons";
import { supabase } from "../../api";
import CalendarMonthSelector from "../../components/calendar-month-selector";
import getSchedule from "../../lib/services/midweek-schedule-service";

const MONTH_NAMES = [
   [
      { name: 'January',  number: 1 },
      { name: 'February', number: 2 },
      { name: 'March',    number: 3 }
   ],
   [
      { name: 'April', number: 4 },
      { name: 'May',   number: 5 },
      { name: 'June',  number: 6 }
   ],
   [
      { name: 'July',      number: 7 },
      { name: 'August',    number: 8 },
      { name: 'September', number: 9 }
   ],
   [
      { name: 'October',  number: 10 },
      { name: 'November', number: 11 },
      { name: 'December', number: 12 }
   ]
]

export default function AV() {
   const size = useContext(ResponsiveContext);
   const [schedules, setSchedules] = useState([]);
   const [publishers, setPublishers] = useState([]);

   const [schedule, setSchedule] = useState([]);

   const [title, setTitle] = useState(null);
   const [selectedDate, setDate] = useState(moment());
   const [selectedMonth, setMonth] = useState(moment().format("M"));
   const [selectedYear, setYear] = useState(moment().format("YYYY"));
   const [showDates, setShowDates] = useState(false);
   const [showClock, setShowClock] = useState(false);

   useEffect(() => {
      fetchPublishers()
      fetchSchedules()
      getMidweekMeeting()
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
      const { data } = await supabase.from("schedule_av").select("*,av_host_id(*),av_media_id(*)")
         .gte('event_date', moment(selectedMonth + ' ' + selectedYear, 'M YYYY').clone().startOf('year').format('MM-DD-YYYY'))
         .lte('event_date', moment(selectedMonth + ' ' + selectedYear, 'M YYYY').clone().endOf('year').format('MM-DD-YYYY'))
      data.sort((a,b) => {
         if (a.event_date > b.event_date) return 1
         if (a.event_date < b.event_date) return -1
         return 0
      })
      setSchedules(data)
   }

   async function createSchedule() {
      const response = await supabase.from("schedule_av").insert({
         event_date: moment(selectedMonth + ' ' + selectedYear, 'M YYYY').clone().endOf('month').format('YYYY-MM-DD'),
      }).single()
      fetchSchedules()
   }

   async function deleteSchedule(id) {
      await supabase.from("schedule_av").delete().match({ id })
      fetchSchedules()
   }

   async function updateScheduleDate(id, date) {
      await supabase.from("schedule_av").update({event_date:date}).match({ id })
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

   async function getMidweekMeeting(updatedDate = moment()) {
      // let schedule = { data: { items: await getSchedule(2021, 26) } };
      let schedule = await axios.get(`/api/midweek-schedule?year=${updatedDate.format("YYYY")}&week=${updatedDate.week() - 1}`);
      setSchedule(schedule.data.items);
      console.log(schedule.data.items);
      // console.log(response.data.items);
   }

   function onChangeDate(updatedDate) {
      setDate(updatedDate);
      setMonth(updatedDate.format("M"));
      setYear(updatedDate.format("YYYY"));
      getMidweekMeeting(updatedDate);
   }

   function onChangeTitle(newTitle) {
      setTitle(newTitle);
   }

   function getStartTime(index) {
      if (!showClock) {
         return schedule[index].time + 'm';
      }
      let startTime = moment('7:00', 'h:mm');
      let minutes = schedule.filter((s, i) => i < index).map(s => {
         let counselTime = 0;
         if (s.studentPart) {
            counselTime = 2;
         }
         return s.time + counselTime;
      }).reduce((prev, cur, arr) => prev + cur,0);
      return startTime.add(minutes, 'minute').format('h:mm');
   }

   if (!schedules || !publishers) return (<div>Loading...</div>)
   return (
      <div>
      <h1 className="text-3xl font-semibold tracking-wide mt-6 mb-2">
         Midweek Meeting Schedule
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
            <CalendarMonthSelector onChange={onChangeDate} onTitle={onChangeTitle} onSelect={() => setShowDates(false)} useWeeks="true" />
         }
         <Box gridArea="main" className={size != 'small' ? "p-5" : ''}>
            {size != 'small' &&
            <Card>
               <CardHeader pad="small">
                  <Box>
                     <Text className="font-bold text-xl">{title}</Text>
                     <Text className="font-bold text-xl">
                        {schedule && schedule.length > 0 &&
                           <h3>{schedule[0].title}</h3>
                        }
                     </Text>
                  </Box>
                  <Box justify="start" direction="row">
                     <Box className="mr-3">
                        <Button>
                           <Box direction="row" onClick={() => setShowClock(!showClock)}>
                              {!showClock && 
                                 <>
                                    <Text className="text-xl pr-2">Time</Text>
                                    <Clock />
                                 </>
                              }
                              {showClock && 
                                 <>
                                    <Text className="text-xl pr-2">Duration</Text>
                                    <Alarm />
                                 </>
                              }
                           </Box>
                        </Button>
                     </Box>
                     <Box className="mr-3" alignSelf="center">
                        <Link href={{ pathname: "/schedules/av/print", query: { from: moment(selectedMonth + ' ' + selectedYear, 'M YYYY').clone().startOf('month').format('MM-DD-YYYY'), to: moment(selectedMonth + ' ' + selectedYear, 'M YYYY').clone().endOf('month').format('MM-DD-YYYY') }}}>
                           <Box direction="row">
                              <Text className="mr-2">Print</Text>
                              <Print />
                           </Box>
                        </Link>
                     </Box>
                     <Box alignSelf="center">
                        <Button>
                           <Box direction="row">
                              <Text className="text-xl pr-2">Auto Assign</Text>
                              <Cycle />
                           </Box>
                        </Button>
                     </Box>
                  </Box>
               </CardHeader>
               <CardBody pad="small">
                  <Grid>
                     <Table>
                        {/* <TableHeader>
                           <TableRow>
                              <TableCell>Time</TableCell>
                              <TableCell>Assignment</TableCell>
                              <TableCell>Publisher #1</TableCell>
                              <TableCell>Publisher #2</TableCell>
                           </TableRow>
                        </TableHeader> */}
                        <TableBody>
                           {schedule.map((item, index) => (
                              <>
                              {item.type == "PRAYER" &&
                                 <TableRow key={index}>
                                    <TableCell>{getStartTime(index)}</TableCell>
                                    <TableCell>
                                       <Box direction="column">
                                          <Text className="font-medium">{item.title}</Text>
                                          <Text className="text-xs font-extralight">{item.description}</Text>
                                       </Box>
                                    </TableCell>
                                    <TableCell>
                                       <Box direction="column">
                                          <Text className="font-medium">Brother</Text>
                                          <Select options={publishers} labelKey={p => `${p.last_name}, ${p.first_name}`} />
                                       </Box>
                                    </TableCell>
                                 </TableRow>
                              }
                              {item.type == "COMMENTS" &&
                                 <TableRow key={index}>
                                 <TableCell>{getStartTime(index)}</TableCell>
                                    <TableCell>
                                       <Box direction="column">
                                          <Text className="font-medium">{item.title}</Text>
                                          <Text className="text-xs font-extralight">{item.description}</Text>
                                       </Box>
                                    </TableCell>
                                    <TableCell>
                                       <Box direction="column">
                                          <Text className="font-medium">Chairman</Text>
                                          <Select options={publishers} labelKey={p => `${p.last_name}, ${p.first_name}`} />
                                       </Box>
                                    </TableCell>
                                 </TableRow>
                              }
                              {item.type == "HEADER" &&
                                 <TableRow key={index} className={item.section == 2 ? 'bg-blue-400 text-white font-bold' : item.section == 3 ? 'bg-yellow-400 text-white font-bold' : item.section == 4 ? 'bg-green-400 text-white font-bold' : 'text-white font-bold'}>
                                    <TableCell></TableCell>
                                    <TableCell className="font-extrabold">{item.title}</TableCell>
                                    <TableCell className="font-bold"></TableCell>
                                    <TableCell className="font-bold"></TableCell>
                                 </TableRow>
                              }
                              {["DEMO"].indexOf(item.type) > -1 &&
                                 <TableRow key={index}>
                                 <TableCell>{getStartTime(index)}</TableCell>
                                    <TableCell>
                                       <Box direction="column">
                                          <Text className="font-medium">{item.title} <span className="font-light">({item.lesson})</span></Text>
                                          <Text className="text-xs font-extralight">{item.description}</Text>
                                       </Box>
                                    </TableCell>
                                    <TableCell>
                                       <Box direction="column">
                                          <Text className="font-medium">Householder</Text>
                                          <Select options={publishers} labelKey={p => `${p.last_name}, ${p.first_name}`} />
                                       </Box>
                                    </TableCell>
                                    <TableCell>
                                       <Box direction="column">
                                          <Text className="font-medium">Publisher</Text>
                                          <Select options={publishers} labelKey={p => `${p.last_name}, ${p.first_name}`} />
                                       </Box>
                                    </TableCell>
                                 </TableRow>
                              }
                              {["READING","TALK"].indexOf(item.type) > -1 &&
                                 <TableRow key={index}>
                                 <TableCell>{getStartTime(index)}</TableCell>
                                    <TableCell>
                                       <Box direction="column">
                                          <Text className="font-medium">{item.title} <span className="font-light">({item.lesson})</span></Text>
                                          <Text className="text-xs font-extralight">{item.description}</Text>
                                       </Box>
                                    </TableCell>
                                    <TableCell>
                                       <Box direction="column">
                                          <Text className="font-medium">Brother</Text>
                                          <Select options={publishers} labelKey={p => `${p.last_name}, ${p.first_name}`} />
                                       </Box>
                                    </TableCell>
                                 </TableRow>
                              }
                              {["TREASURES","GEMS","LIVING"].indexOf(item.type) > -1 &&
                                 <TableRow key={index}>
                                 <TableCell>{getStartTime(index)}</TableCell>
                                    <TableCell>
                                       <Box direction="column">
                                          <Text className="font-medium">{item.title}</Text>
                                          <Text className="text-xs font-extralight">{item.description}</Text>
                                       </Box>
                                    </TableCell>
                                    <TableCell>
                                       <Box direction="column">
                                          <Text className="font-medium">Brother</Text>
                                          <Select options={publishers} labelKey={p => `${p.last_name}, ${p.first_name}`} />
                                       </Box>
                                    </TableCell>
                                 </TableRow>
                              }
                              {["VIDEO"].indexOf(item.type) > -1 &&
                                 <TableRow key={index}>
                                 <TableCell>{getStartTime(index)}</TableCell>
                                    <TableCell>
                                       <Box direction="column">
                                          <Text className="font-medium">{item.title}</Text>
                                          <Text className="text-xs font-extralight">{item.description}</Text>
                                       </Box>
                                    </TableCell>
                                    <TableCell>
                                       <Box direction="column">
                                          <Text className="font-medium">Chairman</Text>
                                          <Select options={publishers} labelKey={p => `${p.last_name}, ${p.first_name}`} />
                                       </Box>
                                    </TableCell>
                                 </TableRow>
                              }
                              {["SONG"].indexOf(item.type) > -1 &&
                                 <TableRow key={index}>
                                 <TableCell>{getStartTime(index)}</TableCell>
                                    <TableCell>
                                       <Box direction="column">
                                          <Text className="font-medium">{item.title}</Text>
                                       </Box>
                                    </TableCell>
                                 </TableRow>
                              }
                              {["CBS_CONDUCTOR"].indexOf(item.type) > -1 &&
                                 <TableRow key={index}>
                                 <TableCell>{getStartTime(index)}</TableCell>
                                    <TableCell>
                                       <Box direction="column">
                                          <Text className="font-medium">{item.title}</Text>
                                          <Text className="text-xs font-extralight">{item.description}</Text>
                                       </Box>
                                    </TableCell>
                                    <TableCell>
                                       <Box direction="column">
                                          <Text className="font-medium">Conductor</Text>
                                          <Select options={publishers} labelKey={p => `${p.last_name}, ${p.first_name}`} />
                                       </Box>
                                    </TableCell>
                                    <TableCell>
                                       <Box direction="column">
                                          <Text className="font-medium">Reader</Text>
                                          <Select options={publishers} labelKey={p => `${p.last_name}, ${p.first_name}`} />
                                       </Box>
                                    </TableCell>
                                 </TableRow>
                              }
                              </>
                           ))}
                           {/* <TableRow>
                              <TableCell>
                                 <Text className="font-bold">Chairman</Text>
                              </TableCell>
                              <TableCell>
                                 
                              </TableCell>
                           </TableRow>
                           <TableRow>
                              <TableCell>
                                 <Text className="font-bold">Song 55</Text>
                              </TableCell>
                              <TableCell>
                                 
                              </TableCell>
                           </TableRow>
                           <TableRow>
                              <TableCell>
                                 <Text className="font-bold">Prayer</Text>
                              </TableCell>
                              <TableCell>
                                 
                              </TableCell>
                           </TableRow>
                           <TableRow className="bg-blue-400">
                              <TableCell>
                                 <Text className="font-bold">Treasures from God's Word</Text>
                              </TableCell>
                              <TableCell>
                                 <Text className="font-bold"></Text>
                              </TableCell>
                           </TableRow>
                           <TableRow>
                              <TableCell>
                                 <Text className="font-bold">Treasures Talk</Text>
                              </TableCell>
                              <TableCell>
                                 
                              </TableCell>
                           </TableRow>
                           <TableRow>
                              <TableCell>
                                 <Text className="font-bold">Spiritual Gems</Text>
                              </TableCell>
                              <TableCell>
                                 
                              </TableCell>
                           </TableRow>
                           <TableRow>
                              <TableCell>
                                 <Text className="font-bold">Bible Reading</Text>
                              </TableCell>
                              <TableCell>
                                 
                              </TableCell>
                           </TableRow>
                           <TableRow className="bg-yellow-400">
                              <TableCell>
                                 <Text className="font-bold">Apply Yourself to the Field Ministry</Text>
                              </TableCell>
                              <TableCell>
                                 <Text className="font-bold"></Text>
                              </TableCell>
                           </TableRow>
                           <TableRow>
                              <TableCell>
                                 <Text className="font-bold">Initial Call</Text>
                              </TableCell>
                              <TableCell>
                                 
                              </TableCell>
                           </TableRow>
                           <TableRow>
                              <TableCell>
                                 <Text className="font-bold">Return Visit</Text>
                              </TableCell>
                              <TableCell>
                                 
                              </TableCell>
                           </TableRow>
                           <TableRow>
                              <TableCell>
                                 <Text className="font-bold">Bible Study</Text>
                              </TableCell>
                              <TableCell>
                                 
                              </TableCell>
                           </TableRow>
                           <TableRow className="bg-red-400">
                              <TableCell>
                                 <Text className="font-bold">Living As Christians</Text>
                              </TableCell>
                              <TableCell>
                                 <Text className="font-bold"></Text>
                              </TableCell>
                           </TableRow>
                           <TableRow>
                              <TableCell>
                                 <Text className="font-bold">Discussion #1</Text>
                              </TableCell>
                              <TableCell>
                                 
                              </TableCell>
                           </TableRow>
                           <TableRow>
                              <TableCell>
                                 <Text className="font-bold">Congregation Bible Study Conductor</Text>
                              </TableCell>
                              <TableCell>
                                 
                              </TableCell>
                           </TableRow>
                           <TableRow>
                              <TableCell>
                                 <Text className="font-bold">Congregation Bible Study Reader</Text>
                              </TableCell>
                              <TableCell>
                                 
                              </TableCell>
                           </TableRow> */}
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
                  <Text className="p-3 font-bold text-xl">{moment(selectedMonth + ' ' + selectedYear, "M YYYY").format("MMMM YYYY")}</Text>
                  {schedules.filter(s => moment(s.event_date).isSame(moment(selectedMonth + ' ' + selectedYear, 'M YYYY'), 'month')).map((schedule,index) => (<Card pad="medium" margin="medium" key={index}>
                     <CardHeader>
                        <Box direction="column">
                           <Text>Date</Text>
                           <DateInput format="mm/dd/yyyy" value={schedule.event_date} onChange={(e) => updateScheduleDate(schedule.id, e.value)}></DateInput>
                        </Box>
                     </CardHeader>
                     <CardBody>
                        <Text className="mt-3">Host</Text>
                        <Select options={publishers} defaultValue={schedule.av_host_id} value={schedule.av_host_id || 0} valueKey="id" labelKey={p => `${p.last_name}, ${p.first_name}`} onChange={(e) => updateScheduleHost(schedule.id, e.value)} />
                        <Text className="mt-3">Media</Text>
                        <Select options={publishers} defaultValue={schedule.av_media_id} value={schedule.av_media_id || 0} valueKey="id" labelKey={p => `${p.last_name}, ${p.first_name}`} onChange={(e) => updateScheduleMedia(schedule.id, e.value)} />
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