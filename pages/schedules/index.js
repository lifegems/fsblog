import Link from 'next/link';

function Schedules(props) {
   return (
      <div>
         <h1 className="text-xl font-bold">Schedules</h1>
         <hr/>
         <Link href="/schedules/av">
            <span className="mr-6 cursor-pointer text-blue-800">AV Schedule</span>
         </Link>
         <p>Manage AV Schedules</p>
      </div>
    )
 }
 
 export default Schedules