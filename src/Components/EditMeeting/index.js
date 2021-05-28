import React, { useState, useEffect } from 'react';
import Notes from 'Components/Notes'
import Button from '@material-ui/core/Button'
import * as Consts from 'Consts';
import { config } from 'Consts';
import { useParams, useHistory } from "react-router-dom";
import * as apiService from 'services/apiService'

function EditMeeting() {

    const [meeting, setMeeting] = useState();
    const params = useParams();
    let history = useHistory();

    useEffect(getMeeting, []);

    function getMeeting() {
        if (params.Id) {
            let id = params.Id;
            console.log(id);
            fetchMeeting(id);
        }
        else {
            setMeeting({ meeting: { beforeNotes: '', duringNotes: '', afterNotes: '' } });
        }
    }

    async function fetchMeeting(id) {
        console.log("Fetch one meeting from server");

        const meeting = await apiService.fetchMeeting(id);
        setMeeting(meeting);
    }

    const saveMeeting = () => {
        console.log("Save meeting");
        fetch(`${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETING_UPDATE_MEETING}`, {
            mode: 'cors',
            crossDomain: true,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(meeting)
        })
            .then(respone => respone.json())
            .then(result => setMeeting(result))
            .catch(error => error);
        console.log("Finish post");
    }

    const updateState = (event) => {
        const value = event.target.value;
        const name = event.target.name

        const x = { ...meeting, [name]: value }
        setMeeting({ x })
    }

    const save = () => {
        saveMeeting();
    }

    const close = () => {
        console.log("close");
        console.log(params);
        history.push('/List/' + params.Id);
    }


    if (meeting == null) {
        return <div>xxx</div>
    }
    else {
        return (
            <fieldset>
                <p>Title: {meeting.subject}</p>
                <Notes title='Subject' name='subject' notes={meeting.subject} updateState={updateState} />
                <Notes title='Before notes' name='beforeNotes' notes={meeting.beforeNotes} updateState={updateState} />
                <Notes title='During notes' name='duringNotes' notes={meeting.duringNotes} updateState={updateState} />
                <Notes title='After notes' name='afterNotes' notes={meeting.afterNotes} updateState={updateState} />
                <Button variant="contained" color="primary" onClick={save}>Save</Button>
                <Button variant="contained" color="primary" onClick={close}>Close</Button>
            </fieldset>
        )
    }
}

export default EditMeeting;