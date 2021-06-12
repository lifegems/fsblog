import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../api";

const DEFAULT_PUBLISHER = {
  first_name: "",
  last_name: "",
  privilege: [{
    exemplary_flag: false,
    ms_flag: false,
    elder_flag: false,
    prayer_flag: false
  }]
};

export default function Publishers() {
  const [publishers, setPublishers] = useState([]);
  const [selectedPub, setSelectedPub] = useState({...DEFAULT_PUBLISHER});
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");

  useEffect(() => {
    fetchPublishers();
  }, []);

  async function fetchPublishers() {
    const user = supabase.auth.user();
    const { data } = await supabase.from("publisher").select("*,privilege(id,exemplary_flag,ms_flag,elder_flag,prayer_flag)");
    data.sort(function(a, b){
      if(a.last_name < b.last_name) { return -1; }
      if(a.last_name > b.last_name) { return 1; }
      return 0;
    })
    setPublishers(data);
  }
  async function createPublisher() {
    await supabase.from("publisher").insert({
      first_name: selectedPub.first_name,
      last_name: selectedPub.last_name
    })
    setSelectedPub({...DEFAULT_PUBLISHER})
    fetchPublishers();
  }
  async function updatePublisher() {
    await supabase.from("publisher").update({
      first_name: selectedPub.first_name,
      last_name: selectedPub.last_name
    }).eq('id', selectedPub.id)
    setSelectedPub({...DEFAULT_PUBLISHER})
    fetchPublishers();
  }
  async function deletePublisher(id) {
    await supabase.from("publisher").delete().match({ id });
    setSelectedPub({...DEFAULT_PUBLISHER})
    fetchPublishers();
  }
  function selectPublisher(publisher) {
    setSelectedPub(publisher)
  }

  function newPublisher() {
    setSelectedPub({...DEFAULT_PUBLISHER})
  }

  function updateSelected(publisher, key, value) {
    let updatedPub = {...publisher}
    updatedPub[key] = value
    setSelectedPub(updatedPub)
  }

  function updatePrivilege(publisher, key, value) {
    let updatedPub = {...publisher}
    if (!updatedPub.privilege && !updatedPub.privilege.length) {
      updatedPub.privilege = [...DEFAULT_PUBLISHER.privilege]
    }
    updatedPub.privilege[0][key] = value
    setSelectedPub(updatedPub)
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-wide mt-6 mb-2">
        Publishers
      </h1>
      <div>
        <dl>
          <dt>{publishers.length} Total Publishers</dt>
        </dl>
      </div>
      <hr/>
      <div className="mt-5 mb-5">
        <div>
          <label className="">
            First Name
          </label>
          <br />
          <input value={selectedPub.first_name} onChange={(e) => updateSelected(selectedPub, 'first_name', e.target.value)} className="border p-2" id="first_name" />
          <br />
        </div>
        <div>
          <label className="">
            Last Name
          </label>
          <br />
          <input value={selectedPub.last_name} onChange={(e) => updateSelected(selectedPub, 'last_name', e.target.value)} className="border p-2" id="last_name" />
          <br />
        </div>
        <div>
            <label className="mr-4">Exemplary</label>
            <input type="checkbox" onChange={(e) => updatePrivilege(selectedPub, 'exemplary_flag', e.target.value)} checked={selectedPub && selectedPub.privilege && selectedPub.privilege.length && selectedPub.privilege[0].exemplary_flag} className="border p-2 mr-4" />

            <label className="mr-4">Prayer</label>
            <input type="checkbox" checked={selectedPub && selectedPub.privilege && selectedPub.privilege.length && selectedPub.privilege[0].prayer_flag} className="border p-2 mr-4" />

            <label className="mr-4">Ministerial Servant</label>
            <input type="checkbox" checked={selectedPub && selectedPub.privilege && selectedPub.privilege.length && selectedPub.privilege[0].ms_flag} className="border p-2 mr-4" />

            <label className="mr-4">Elder</label>
            <input type="checkbox" checked={selectedPub && selectedPub.privilege && selectedPub.privilege.length && selectedPub.privilege[0].elder_flag} className="border p-2 mr-4" />
        </div> 
        <div> 
          {/* update addPublisher function */}
          {selectedPub && !selectedPub.id &&
            <input type="submit" value="Create" onClick={createPublisher} className="border p-2 mt-4 bg-green-300 hover:bg-green-100 cursor-pointer" />
          }
          {selectedPub && selectedPub.id &&
            <input type="submit" value="Update" onClick={updatePublisher} className="border p-2 mt-4 bg-green-300 hover:bg-green-100 cursor-pointer" />
          }
          <input type="submit" value="+ New Publisher" onClick={newPublisher} className="border p-2 ml-5 mt-4 hover:bg-green-100 cursor-pointer" />
          <br />
        </div>
      </div>
      <hr/>
      {publishers.map((publisher, index) => (
        <div key={index} className="border-b border-gray-300	mt-8 pb-4">
          <h2 className="font-semibold cursor-pointer" onClick={() => selectPublisher(publisher)}>
            {publisher.last_name}, {publisher.first_name}
          </h2>
          <button className="text-sm mr-4 text-red-500" onClick={() => deletePublisher(publisher.id)}>
            Delete Publisher
          </button>
        </div>
      ))}
    </div>
  );
}
