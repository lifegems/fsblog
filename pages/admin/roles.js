import { useState, useEffect } from "react";
import { supabase } from "../../api";

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [user, setUser] = useState({});
  useEffect(async () => {
    const authUser = await supabase.auth.user();
    setUser(authUser);
    fetchRoles();
    if (user && user.id)
      fetchUserRoles();
  }, []);

  async function fetchRoles() {
    const { data } = await supabase.from("role").select("*");
    setRoles(data || []);
  }
  async function fetchUserRoles() {
    // const user = supabase.auth.user();
    const { data } = await supabase.from("user_role").select("*").filter('user_id', 'eq', user.id);
    setUserRoles(data || []);
  }
  async function createUserRole(userId, roleId) {
    await supabase
      .from('user_role')
      .insert([
          { user_id: userId, role_id: roleId }
      ])
      .single()
    fetchUserRoles()
  }
  async function deleteUserRole(userId, roleId) {
    await supabase
      .from('user_role')
      .delete()
      .match({ user_id: userId, role_id: roleId })
    fetchUserRoles()
  }

  function onChangeRole(roleId) {
    console.log(roleId);
    let updatedUserRoles = [...userRoles];
    if (userRoles.map(u => u.role_id).indexOf(roleId) > -1) {
      // updatedUserRoles = userRoles.filter(u => u.role_id != roleId);
      deleteUserRole(user.id, roleId)
    } else {
      // updatedUserRoles.push({
      //   role_id: roleId,
      //   user_id: user.id
      // })
      createUserRole(user.id, roleId)
    }
    setUserRoles(updatedUserRoles)
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-wide mt-6 mb-2">
        My Roles
      </h1>
      <table className="table-fixed border border-green-700">
        <thead>
          <tr>
            <th className="w-1/8 border text-left p-2">Role</th>
            <th className="w-3/4 border text-left p-2">Description</th>
            <th className="w-1/8 border text-left p-2">Assigned</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role, index) => (
            <tr key={index}>
              <td className="p-2 border"><span>{role.name}</span></td>
              <td className="p-2 border"><span>{role.description}</span></td>
              <td className="p-2 border"><input type="checkbox" onChange={e => onChangeRole(role.id)} checked={userRoles.map(u => u.role_id).indexOf(role.id) > -1} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
