import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react"
import { supabase } from "../../../api"

function getDefaultDate(){
   var now = new Date();
   var day = ("0" + now.getDate()).slice(-2);
   var month = ("0" + (now.getMonth() + 1)).slice(-2);
   var today = now.getFullYear()+"-"+(month)+"-"+(day);

   return today;
}

export default function Schedule() {
   const [schedule, setSchedule] = useState(null)

   const router = useRouter()
   const { id } = router.query
 
   useEffect(() => {
     fetchSchedule()
     async function fetchSchedule() {
       if (!id) return
       const { data } = await supabase
         .from('schedule')
         .select("*,schedule_type(*),schedule_av(*,av_host_id(*),av_media_id(*))")
         .filter('id', 'eq', id)
         .single()
       setSchedule(data)
     }
   }, [id])

   async function updateSchedule() {
      await supabase.from("schedule_av").update({
         id: schedule.schedule_av.id,
         av_host_id: schedule.schedule_av.av_host_id.id,
         av_media_id: schedule.schedule_av.av_media_id.id,
      }).single()
   }

   async function deleteSchedule(id) {
      await supabase.from("schedule").delete().match({ id })
      fetchSchedules()
   }

   function changeDate(eventDate) {
      let updatedSchedule = {...schedule, event_date: eventDate }
      setSchedule(updatedSchedule)
      updateSchedule()
   }

   function changeAVHost(pub) {
      console.log(pub)
      let updatedSchedule = { ...schedule, schedule_av: {...schedule.schedule_av, av_host_id: pub }}
      setSchedule(updatedSchedule)
      updateSchedule()
   }

   function changeAVMedia(pub) {
      let updatedSchedule = { ...schedule, schedule_av: {...schedule.schedule_av, av_media_id: pub }}
      setSchedule(updatedSchedule)
      updateSchedule()
   }

   if (!schedule) return (<p>Loading...</p>)
   return (
      <>
         <Link href="/schedules"><span className="text-blue-900 mb-5 cursor-pointer">Schedules</span></Link>
         <Link href="/schedules/av"><span className="text-blue-900 mb-5 cursor-pointer">AV</span></Link>
         <hr/>
         <h2 className="text-xl font-bold">{schedule.schedule_type.name}</h2>
         <input className="border p-2 mt-3" value={schedule.event_date} type="date" onChange={e => changeDate(e)} />

         <h2>Attendant</h2>
         <PublisherList selected={schedule.schedule_av.av_host_id.id} onChange={e => changeAVHost(e.target.value)} />

         <h2>Media</h2>
         <PublisherList selected={schedule.schedule_av.av_media_id.id} onChange={e => changeAVMedia(e.target.value)} />
      </>
   )
}

function PublisherList({ selected, onChange }) {
   const [publishers, setPublishers] = useState([])
   const [publisher, setPublisher] = useState(null)

   useEffect(() => {
      fetchPublishers()
      setPublisher(publishers.filter(p => p.id == selected)[0])
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

   function onChangePublisher(e) {
      let publisher = publishers.filter(p => p.id == e)[0]
      setPublisher(publisher)
      onChange(publisher)
   }

   return (
      <select className="border p-1 mt-2" value={selected} onChange={onChangePublisher}>
         <option>--</option>
      {publishers.map((publisher, index) => (
         <option value={publisher.id} key={index}>{publisher.last_name}, {publisher.first_name}</option>
      ))}
      </select>
   )
}