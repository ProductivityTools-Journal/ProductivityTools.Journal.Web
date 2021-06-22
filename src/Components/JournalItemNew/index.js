import React, { useState } from 'react';
import Notes from 'Components/Notes'
import Button from '@material-ui/core/Button'
import { useParams, useHistory } from 'react-router-dom'
import * as apiService from 'services/apiService'

function NewJournalItem(props) {

    const [meeting, setMeeting] = useState({ subject: 'InitialMeetingName', beforeNotes: null, duringNotes: null, afterNotes: null });
    let history = useHistory();

    const updateState = (event) => {
        const value = event.target.value;
        const name = event.target.name;
        const x = {}
        x[name] = value;
        setMeeting(prevMeeting => ({ ...prevMeeting, ...x }));
    }

    const save = async () => {
        let id = props.TreeId;
        meeting.TreeId = Number(id);
        const r = await apiService.saveMeeting(meeting);
        setMeeting(r);
    }

    const close = () => {
        props.clearEditMeeting();
    }

    return (
        <fieldset>
            <Notes title='Subject' name='subject' notes={meeting.subject} updateState={updateState} />
            <Notes title='Before notes' name='beforeNotes' notes={meeting.beforeNotes} updateState={updateState} />
            <Notes title='During notes' name='duringNotes' notes={meeting.duringNotes} updateState={updateState} />
            <Notes title='After notes' name='afterNotes' notes={meeting.afterNotes} updateState={updateState} />
            <Button variant="contained" color="primary" onClick={save}>Save</Button>
            <Button variant="contained" color="primary" onClick={close}>Close</Button>
        </fieldset>
    )



}

export default NewJournalItem;