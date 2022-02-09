import React, { useState } from 'react';
import Notes from 'Components/Notes'
import Button from '@material-ui/core/Button'
import { useParams, useHistory } from 'react-router-dom'
import * as apiService from 'services/apiService'
import { v4 as uuid } from 'uuid';

function NewJournalItem(props) {

    const [meeting, setMeeting] = useState({ subject: 'InitialMeetingName', notesList: [{ type: 'new', notes: 'Add notes here', guid: uuid() }] });
    let history = useHistory();
    const unique_id = uuid();

    const updateState = (event) => {
        const value = event.target.value;
        const name = event.target.name;
        const x = {}
        x[name] = value;
        setMeeting(prevMeeting => ({ ...prevMeeting, ...x }));
    }

    const updateElementInList = (value, journalItemDetailsGuid, field) => {
        let notes = meeting.notesList;
        var editedElement = notes.find(x => x.guid == journalItemDetailsGuid);
        editedElement[field] = value;
        setMeeting(prevMeeting => ({ ...prevMeeting, notesList: notes }));
    }

    const save = async () => {

        let id = props.TreeId;
        meeting.TreeId = Number(id);
        const r = await apiService.saveMeeting(meeting);
        setMeeting(prevMeeting => ({ ...prevMeeting, journalItemId: r }));
    }

    const close = () => {
        props.clearEditMeeting();
    }

    const newJournalItemDetails = () => {
        //let newNotesList = meeting.notesList;
        let newNotesList = [...meeting.notesList, { type: 'new', notes: 'Add notes here', guid: uuid(), status: 'New' }]
        setMeeting(prevMeeting => ({ ...prevMeeting, notesList: newNotesList }));
    }

    return (
        <fieldset>
            <Notes title='Subject' name='subject' notes={meeting.subject} updateState={updateState} />
            <hr></hr>
            <p>{unique_id}</p>
            <p>fdsa</p>
            {meeting.notesList.map(n => {
                return (<Notes title={n.type} notes={n.notes} name='notes' guid={n.guid} updateState={updateElementInList} ></Notes>)
            })}
            <Button variant="contained" color="primary" onClick={newJournalItemDetails}>Add details</Button>
            <Button variant="contained" color="primary" onClick={save}>Save</Button>
            <Button variant="contained" color="primary" onClick={close}>Close</Button>
        </fieldset>
    )



}

export default NewJournalItem;