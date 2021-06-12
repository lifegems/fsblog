import Link from 'next/link';

function Admin(props) {
   return (
      <div>
         <h1 className="text-xl font-bold">Administrator</h1>
         <hr/>
         <Link href="/admin/roles">
            <span className="mr-6 cursor-pointer text-blue-800">Roles</span>
         </Link>
         <p>Manage roles for users</p>
      </div>
    )
 }
 
 export default Admin