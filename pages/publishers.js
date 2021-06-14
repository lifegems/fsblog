import { useState, useEffect } from "react";
import { Box, Button, Card, CardHeader, CardBody, CardFooter, CheckBox, FormField, Grid, Layer, List, Tab, Tabs, Text, TextInput } from 'grommet'
import { Add, Checkmark, FormClose, StatusGood, Trash } from 'grommet-icons'
import Link from "next/link";
import { supabase } from "../api";

const DEFAULT_PUBLISHER = {
  first_name: "",
  last_name: "",
  privilege: [{
    exemplary_flag: false,
    ms_flag: false,
    elder_flag: false,
    prayer_flag: false,
    av_host_flag: false,
    av_media_flag: false
  }]
};

export default function Publishers() {
  const [publishers, setPublishers] = useState([]);
  const [selectedPub, setSelectedPub] = useState({...DEFAULT_PUBLISHER});
  const [selectedPubIndex, setSelectedPubIndex] = useState(undefined);
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchPublishers();
  }, []);

  async function fetchPublishers() {
    const user = supabase.auth.user();
    const { data } = await supabase.from("publisher").select("*,privilege(*)");
    data.sort(function(a, b){
      if(a.last_name < b.last_name) { return -1; }
      if(a.last_name > b.last_name) { return 1; }
      return 0;
    })
    setPublishers(data);
  }
  async function createPublisher() {
    if (!selectedPub.first_name || !selectedPub.last_name) return;
    let response = await supabase.from("publisher").insert({
      first_name: selectedPub.first_name,
      last_name: selectedPub.last_name
    }).single()
    await supabase.from("privilege").insert({
      publisher_id:   response.body.id,
      exemplary_flag: selectedPub.privilege[0].exemplary_flag,
      prayer_flag:    selectedPub.privilege[0].prayer_flag,
      ms_flag:        selectedPub.privilege[0].ms_flag,
      elder_flag:     selectedPub.privilege[0].elder_flag,
      av_host_flag:   selectedPub.privilege[0].av_host_flag,
      av_media_flag:  selectedPub.privilege[0].av_media_flag,
    })
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
    }, 3000)
    await fetchPublishers()
    setSelectedPub(publishers.filter(p => p.id == response.body.id)[0])
  }
  async function updatePublisher() {
    await supabase.from("publisher").update({
      first_name: selectedPub.first_name,
      last_name: selectedPub.last_name
    }).eq('id', selectedPub.id)
    await supabase.from("privilege").update({
      publisher_id:   selectedPub.id,
      exemplary_flag: selectedPub.privilege[0].exemplary_flag,
      prayer_flag:    selectedPub.privilege[0].prayer_flag,
      ms_flag:        selectedPub.privilege[0].ms_flag,
      elder_flag:     selectedPub.privilege[0].elder_flag,
      av_host_flag:   selectedPub.privilege[0].av_host_flag,
      av_media_flag:  selectedPub.privilege[0].av_media_flag,
    }).eq('publisher_id', selectedPub.id)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
    }, 3000)
    fetchPublishers();
  }
  async function deletePublisher(id) {
    await supabase.from("privilege").delete().match({ publisher_id: id });
    await supabase.from("publisher").delete().match({ id });
    setSelectedPub({...DEFAULT_PUBLISHER})
    fetchPublishers();
  }
  function selectPublisher(publisher) {
    setSelectedPub(publisher)
    let index = publishers.indexOf(publisher)
    setSelectedPubIndex(index);
  }

  function newPublisher() {
    setSelectedPub({...DEFAULT_PUBLISHER})
    setSelectedPubIndex(undefined)
  }

  function updateSelected(publisher, key, value) {
    let updatedPub = {...publisher}
    updatedPub[key] = value
    setSelectedPub(updatedPub)
  }

  function updatePrivilege(publisher, key, value) {
    let updatedPub = {...publisher}
    if (updatedPub.privilege.length == 0) {
      updatedPub.privilege.push({...DEFAULT_PUBLISHER.privilege[0]})
    }
    updatedPub.privilege[0][key] = !updatedPub.privilege[0][key]
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
      <Grid fill areas={[
          { name: 'nav', start: [0, 0], end: [0, 0] },
          { name: 'main', start: [1, 0], end: [1, 0] },
        ]} columns={['medium', 'flex']} rows={['flex']} gap="small">
        <Box gridArea="nav">
          <List data={publishers} primaryKey={(p) => p.last_name + ", " + p.first_name} onClickItem={(p) => selectPublisher(p.item)} itemProps={
            {[selectedPubIndex]: { background: 'brand' }} }/>
          <input type="submit" value="+ New Publisher" onClick={newPublisher} className="border p-2 mt-4 hover:bg-green-100 cursor-pointer" />
        </Box>
        <Box gridArea="main" className="p-5">
          {!selectedPub &&
            <h1>Select a publisher from the list or <a className="cursor-pointer text-blue-600" onClick={newPublisher}>Create a New Publisher</a>.</h1>
          }
          {selectedPub &&
            <Tabs alignControls="start">
              <Tab title="Publisher">
                <Card>
                  <CardHeader pad="medium">
                    <TextInput
                      placeholder="First Name"
                      value={selectedPub.first_name}
                      onChange={(e) => updateSelected(selectedPub, 'first_name', e.target.value)}
                    />
                    <TextInput
                      placeholder="Last Name"
                      value={selectedPub.last_name}
                      onChange={(e) => updateSelected(selectedPub, 'last_name', e.target.value)}
                    />
                  </CardHeader>
                  <CardBody pad="medium">
                    <Box direction="row" justify="start" pad="medium">
                      <Box className="mr-10">
                        <h3 className="font-bold mt-3">Publisher Status</h3>
                        <CheckBox label="Exemplary" onChange={(e) => updatePrivilege(selectedPub, 'exemplary_flag', e.target.value)} checked={selectedPub && selectedPub.privilege.length && selectedPub.privilege[0].exemplary_flag} className="border p-2 mr-4" />
                        <CheckBox label="Prayer" onChange={(e) => updatePrivilege(selectedPub, 'prayer_flag', e.target.value)} checked={selectedPub && selectedPub.privilege.length && selectedPub.privilege[0].prayer_flag} className="border p-2 mr-4" />
                        <CheckBox label="Unbaptized Publisher" className="border p-2 mr-4" />
                        <CheckBox label="Baptized Publisher" className="border p-2 mr-4" />
                        <CheckBox label="Auxiliary Pioneer" className="border p-2 mr-4" />
                        <CheckBox label="Regular Pioneer" className="border p-2 mr-4" />
                        <CheckBox label="Special Pioneer" className="border p-2 mr-4" />

                        <h3 className="font-bold mt-3">Appointments</h3>
                        <CheckBox label="Ministerial Servant" onChange={(e) => updatePrivilege(selectedPub, 'ms_flag', e.target.value)} checked={selectedPub && selectedPub.privilege.length && selectedPub.privilege[0].ms_flag} className="border p-2 mr-4" />
                        <CheckBox label="Elder" onChange={(e) => updatePrivilege(selectedPub, 'elder_flag', e.target.value)} checked={selectedPub && selectedPub.privilege.length && selectedPub.privilege[0].elder_flag} className="border p-2 mr-4" />
                        <h3 className="font-bold mt-3">Privileges</h3>
                        <CheckBox label="AV Host" onChange={(e) => updatePrivilege(selectedPub, 'av_host_flag', e.target.value)} checked={selectedPub && selectedPub.privilege.length && selectedPub.privilege[0].av_host_flag} className="border p-2 mr-4" />
                        <CheckBox label="AV Media" onChange={(e) => updatePrivilege(selectedPub, 'av_media_flag', e.target.value)} checked={selectedPub && selectedPub.privilege.length && selectedPub.privilege[0].av_media_flag} className="border p-2 mr-4" />
                      </Box>

                      <Box className="mr-10">
                        <h3 className="font-bold mt-3">Congregation Responsibilities</h3>
                        <CheckBox label="Accounts Servant" className="border p-2 mr-4" />
                        <CheckBox label="Coordinator of the Body of Elders" className="border p-2 mr-4" />
                        <CheckBox label="Life & Ministry Overseer" className="border p-2 mr-4" />
                        <CheckBox label="Literature Servant" className="border p-2 mr-4" />
                        <CheckBox label="Public Talk Coordinator" className="border p-2 mr-4" />
                        <CheckBox label="Secretary" className="border p-2 mr-4" />
                        <CheckBox label="Service Overseer" className="border p-2 mr-4" />

                        <h3 className="font-bold mt-3">Weekend Meeting</h3>
                        <CheckBox label="Meeting Chairman" className="border p-2 mr-4" />
                        <CheckBox label="Public Speaker" className="border p-2 mr-4" />
                        <CheckBox label="Outgoing Speaker" className="border p-2 mr-4" />
                        <CheckBox label="Watchtower Conductor" className="border p-2 mr-4" />
                        <CheckBox label="Watchtower Reader" className="border p-2 mr-4" />
                      </Box>

                      <Box>
                        <h3 className="font-bold mt-3">Midweek Meeting</h3>
                        <CheckBox label="Life & Ministry Chairman" className="border p-2 mr-4" />
                        <CheckBox label="Treasures Talks" className="border p-2 mr-4" />
                        <CheckBox label="Spiritual Gems" className="border p-2 mr-4" />
                        <CheckBox label="Bible Reading" className="border p-2 mr-4" />
                        <CheckBox label="Initial Call" className="border p-2 mr-4" />
                        <CheckBox label="Return Visit" className="border p-2 mr-4" />
                        <CheckBox label="Bible Study" className="border p-2 mr-4" />
                        <CheckBox label="Talk" className="border p-2 mr-4" />
                        <CheckBox label="Ministry Video" className="border p-2 mr-4" />
                        <CheckBox label="Living As Christians" className="border p-2 mr-4" />
                        <CheckBox label="Congregation Bible Study Conductor" className="border p-2 mr-4" />
                        <CheckBox label="Congregation Bible Study Reader" className="border p-2 mr-4" />
                      </Box>
                    </Box>
                  </CardBody>
                  <CardFooter pad="medium" justify="start">
                    {selectedPub && !selectedPub.id &&
                      <Button hoverIndicator="light-1" onClick={createPublisher} active>
                        <Box pad="small" direction="row" align="center" gap="small">
                          <Add />
                          <Text>Create</Text>
                        </Box>
                      </Button>
                    }
                    {selectedPub && selectedPub.id &&
                      <Button hoverIndicator="light-1" onClick={updatePublisher} active>
                        <Box pad="small" direction="row" align="center" gap="small">
                          <Checkmark />
                          <Text>Update</Text>
                        </Box>
                      </Button>
                    }
                    {selectedPub && selectedPub.id &&
                      <Button color="status-critical" hoverIndicator="light-1" onClick={() => deletePublisher(selectedPub.id)} active>
                        <Box pad="small" direction="row" align="center" gap="small">
                          <Trash />
                          <Text>Delete</Text>
                        </Box>
                      </Button>
                    }
                  </CardFooter>
                </Card>
              </Tab>
              {selectedPub && selectedPub.id &&
                <Tab title="User">
                  <Card>
                    <CardHeader pad="medium" className="border-b">
                      <Text>{selectedPub.first_name} {selectedPub.last_name}</Text>
                    </CardHeader>
                    <CardBody pad="medium">
                      No role information
                    </CardBody>
                  </Card>
                </Tab>
              }
            </Tabs>
          }
        </Box>
      </Grid>
      {saved && (
        <Layer position="top" modal={false} margin={{ vertical: 'medium', horizontal: 'small' }} responsive={false} plain>
          <Box align="center" direction="row" gap="small" justify="between" round="medium" elevation="medium" pad={{ vertical: 'xsmall', horizontal: 'small' }} background="status-ok">
            <Box align="center" direction="row" gap="xsmall">
              <StatusGood />
              <Text>
                Publisher Saved
              </Text>
            </Box>
            <Button icon={<FormClose />} plain />
          </Box>
        </Layer>
      )}
    </div>
  );
}
