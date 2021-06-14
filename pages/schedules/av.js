import Link from "next/link";
import { useState, useEffect } from "react"
import { supabase } from "../../api"

function getDefaultDate(){
   var now = new Date();
   var day = ("0" + now.getDate()).slice(-2);
   var month = ("0" + (now.getMonth() + 1)).slice(-2);
   var today = now.getFullYear()+"-"+(month)+"-"+(day);

   return today;
}

export default function AV() {
   const [schedules, setSchedules] = useState([])
   const [types, setTypes] = useState([])

   const [scheduleDate, setDate] = useState(getDefaultDate())
   const [scheduleType, setType] = useState(0)

   useEffect(() => {
      fetchSchedules()
      fetchTypes()
   }, [])

   async function fetchSchedules() {
      const { data } = await supabase.from("schedule").select("*,schedule_type(*)")
      data.sort((a,b) => {
         if (a.event_date > b.event_date) return -1
         if (a.event_date < b.event_date) return 1
         return 0
      })
      setSchedules(data)
   }

   async function fetchTypes() {
      const { data } = await supabase.from("schedule_type").select("*")
      setTypes(data)
      setType(data[0].id)
   }

   async function createSchedule() {
      const schedule = {
         event_date: scheduleDate,
         type_id: scheduleType
      }
      await supabase.from("schedule").insert(schedule).single()
      fetchSchedules()
   }

   async function deleteSchedule(id) {
      await supabase.from("schedule").delete().match({ id })
      fetchSchedules()
   }

   return (
      <>
         <h2 className="text-xl font-bold">Create New Schedule</h2>
         <select className="border p-3" value={scheduleType} onChange={e => {setType(e.target.value); console.log(e.target.value)}}>
            {types.map(type => (
               <option key={type.id} value={type.id}>{type.name}</option>
            ))}
         </select>
         <input className="border p-2 ml-2" value={scheduleDate} type="date" onChange={e => setDate(e.target.value)} />
         <input className="border p-2 ml-2 bg-green-400 cursor-pointer" type="button" value="Add Schedule" onClick={createSchedule} /><br/>

         <hr/>

         <h2 className="text-xl font-bold">AV Schedules</h2>
         {schedules.map((schedule,index) => (
            <p key={index} className="cursor-pointer">
               <Link href={`/schedules/av/${schedule.id}`}><span>{schedule.event_date} - {schedule.schedule_type.name}</span></Link>
               (<a className="text-red-600 cursor-pointer" onClick={() => deleteSchedule(schedule.id)}>Delete</a>)
            </p>
         ))}
      </>
   )
}

function PublisherList() {
   const [publishers, setPublishers] = useState([])

   useEffect(() => {
      fetchPublishers()
   })

   async function fetchPublishers() {
      const { data } = await supabase.from("publisher").select("*,privilege(*)")
      data.sort((a,b) => {
         if (a.last_name < b.last_name) return -1
         if (a.last_name > b.last_name) return 1
         return 0
      })
      setPublishers(data)
   }

   return (
      <select className="border p-1 mt-2">
         <option>--</option>
      {publishers.map((publisher, index) => (
         <option key={index}>{publisher.last_name}, {publisher.first_name}</option>
      ))}
      </select>
   )
}