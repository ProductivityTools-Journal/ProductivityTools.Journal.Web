import React, { useState } from 'react';
import Notes from 'Components/Notes'
import Button from '@material-ui/core/Button'
import { useParams, useHistory } from 'react-router-dom'
import * as apiService from 'services/apiService'

function NewJournalItem(props) {

    const [meeting, setMeeting] = useState({ subject: 'InitialMeetingName', notesList: [{ type: 'new', notes: 'nnn', guid: '1' }, { type: 'new2', notes: 'nnn2', guid: '2' }] });
    let history = useHistory();

    const updateState = (event) => {
        debugger;
        const value = event.target.value;
        const name = event.target.name;
        const guid = event.target.guid;
        const x = {}
        x[name] = value;
        setMeeting(prevMeeting => ({ ...prevMeeting, ...x }));
    }

    const updateElementInList = (journalItemDetailsGuid, journalItemDetailNotes) => {
        debugger;
        let notes = meeting.notesList;
        var editedElement = notes.find(x => x.guid == journalItemDetailsGuid);
        editedElement.notes = journalItemDetailNotes;
        setMeeting(prevMeeting => ({ ...prevMeeting, notesList: notes }));
    }

    const save = async () => {
        debugger;
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
            <hr></hr>
            {meeting.notesList.map(n => {
                return (<Notes title={n.type} notes={n.notes} name='notes' guid={n.guid} updateState={updateElementInList} ></Notes>)
            })}
            <Button variant="contained" color="primary" onClick={save}>Save</Button>
            <Button variant="contained" color="primary" onClick={close}>Close</Button>
        </fieldset>
    )



}

export default NewJournalItem;