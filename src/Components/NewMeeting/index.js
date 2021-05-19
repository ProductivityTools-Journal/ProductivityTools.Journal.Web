import React, { useState, useEffect} from 'react';
import Notes from 'Components/Notes'
import * as Consts from 'Consts';
import {config} from 'Consts';
import Button from '@material-ui/core/Button'
import { useParams } from 'react-router-dom'

function NewMeeting() {

    const [meeting, setMeeting] = useState({ subject:'InitialMeetingName', beforeNotes: null, duringNotes: null, afterNotes: null});
    const params = useParams();

    // useEffect(() => {
    //     console.log("useeffect");
    //     console.log(meeting);
    //   }, [meeting]);

    console.log('pawel');
    console.log(JSON.stringify(params));

    const updateState = (event) => {
        const value = event.target.value;
        const name = event.target.name;
        const x = {}
        x[name]=value;
        setMeeting(prevMeeting=>({...prevMeeting,...x}));
    }

    const save = () => {
        let id = params.TreeId;
        console.log(id);
        meeting.TreeId=Number(id);
        console.log("Save meeting");
        fetch(`${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETING_NEW_MEETING}`, {
            mode: 'cors',
            crossDomain: true,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(meeting)
        })
            .then(respone => respone.json())
            .then(result => this.setMeeting(result))
            .catch(error => error);
        console.log("Finish post");
    }

    return (
        <div>
            <Notes title='Subject' name='subject' notes={meeting.subject} updateState={updateState} />
            <Notes title='Before notes' name='beforeNotes' notes={meeting.beforeNotes} updateState={updateState} />
            <Notes title='During notes' name='duringNotes' notes={meeting.duringNotes} updateState={updateState} />
            <Notes title='After notes' name='afterNotes' notes={meeting.afterNotes} updateState={updateState} />
            <Button variant="contained" color="primary" onClick={save}>Save</Button>
        </div>
    )



}

export default NewMeeting;