import React, { useState, useEffect } from 'react';
import Notes from 'Components/Notes'
import Button from '@mui/material/Button'

import { useParams } from "react-router-dom";
import * as apiService from 'services/apiService'
import { v4 as uuid } from 'uuid';

function JournalItemEdit(params) {

    const [meeting, setMeeting] = useState();
    const query = useParams();


    useEffect(getMeeting, []);

    function getMeeting() {
        fetchMeeting(params.journalItemId);
    }

    async function fetchMeeting(id) {
        console.log("Fetch one meeting from server");
        const meeting = await apiService.fetchMeeting(id);
        console.log(meeting);

        let notesListWitGuid = meeting.notesList;
        meeting.notesList.forEach(element => {
            element.guid = uuid()
        });

        setMeeting(meeting);

    }

    const saveMeeting = () => {
        console.log("meeting before save");
        console.log(meeting);
        apiService.updateMeeting(meeting);
    }

    const updateState = (event) => {
        const value = event.target.value;
        const name = event.target.name
        console.log("meeting from state meeting1");
        console.log(meeting)
        console.log(name);
        let x = { ...meeting, [name]: value }
        console.log(x);
        setMeeting(x)
        console.log("meeting from state meeting2");
        console.log(meeting)
        setMeeting(prev => ({ ...prev, [name]: value }));
    }

    const updateElementInList = (value, journalItemDetailsGuid,field) => {
        debugger;
        let journalItemDetailNotes = value;
        let notes = meeting.notesList;
        var editedElement = notes.find(x => x.guid == journalItemDetailsGuid);
        editedElement[field] = journalItemDetailNotes;
        setMeeting(prevMeeting => ({ ...prevMeeting, notesList: notes }));
    }

    const save = () => {
        saveMeeting();
        params.clearEditMeeting();
    }

    const close = () => {
        console.log("close");
        console.log(params);
        //history.push('/List/' + params.Id);
        params.clearEditMeeting();
    }

    const newJournalItemDetails = () => {
        //let newNotesList = meeting.notesList;
        let newNotesList = [...meeting.notesList, { type: 'new', notes: 'Add notes here', guid: uuid(), status: 'New' }]
        setMeeting(prevMeeting => ({ ...prevMeeting, notesList: newNotesList }));
    }

    if (meeting == null) {
        return <div>xxx</div>
    }
    else {
        return (
            <fieldset>
                <p>Title: {meeting.subject}</p>
                <Notes title='Subject' name='subject' notes={meeting.subject} updateState={updateState} />
                <hr></hr>
                {meeting.notesList.map(n => {
                    return (<Notes title={n.type} notes={n.notes} name='notes' guid={n.guid} updateState={updateElementInList}></Notes>)
                })}
                {/* <Notes title='Before notes' name='beforeNotes' notes={meeting.beforeNotes} updateState={updateState} />
                <Notes title='During notes' name='duringNotes' notes={meeting.duringNotes} updateState={updateState} />
                <Notes title='After notes' name='afterNotes' notes={meeting.afterNotes} updateState={updateState} /> */}
                <Button variant="contained" color="primary" onClick={newJournalItemDetails}>Add details</Button>
                <Button variant="contained" color="primary" onClick={save}>Save</Button>
                <Button variant="contained" color="primary" onClick={close}>Close</Button>
                <div>{meeting.beforeNotes}</div>
            </fieldset>
        )
    }
}

export default JournalItemEdit;