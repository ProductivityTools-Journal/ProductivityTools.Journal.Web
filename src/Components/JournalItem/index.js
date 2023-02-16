import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import * as moment from 'moment';
import NotesLabel from 'Components/NotesLabel'
import Notes from 'Components/Notes'
import * as apiService from 'services/apiService'
import { v4 as uuid } from 'uuid';


function MeetingItem(props) {

	const { meeting, ...rest } = props;
	const [workingEvent, setWorkingEvent] = useState();


	useEffect(() => {
		setWorkingEvent({ ...meeting });
	}, []);

	const [mode, setMode] = useState('readonly');
	let mt = moment(props.meeting.date);
	let dtDescription = mt.fromNow();
	let dtFormated = mt.format('YYYY.MM.DD hh:mm')
	const buttonStyle = { textAlign: 'left' }
	console.log("meeting");
	console.log(props.meeting);

	const edit = () => {

		console.log()
		//setMode('edit');
		meeting.notesList.forEach(element => {
			element.guid = uuid()
		});
		//setWorkingEvent(meeting);
		setWorkingEvent({ ...meeting, mode: 'edit' });
	}

	const updateState = (event) => {
		const value = event.target.value;
		const name = event.target.name
		setWorkingEvent(prev => ({ ...prev, [name]: value }));
	}

	const updateElementInList = (value, journalItemDetailsGuid, field) => {
		let journalItemDetailNotes = value;
		let notes = workingEvent.notesList;
		var editedElement = notes.find(x => x.guid === journalItemDetailsGuid);
		editedElement[field] = journalItemDetailNotes;
		setWorkingEvent(prevMeeting => ({ ...prevMeeting, notesList: notes }));
	}
	const newJournalItemDetails = () => {
		let newNotesList = [...workingEvent.notesList, { type: 'new', notes: 'Add notes here', guid: uuid(), status: 'New' }]
		setWorkingEvent(prevWorkingEvent => ({ ...prevWorkingEvent, notesList: newNotesList }));
	}

	const save = async () => {
		debugger;
		workingEvent.notesList.forEach(x => x.notesType = 'Slate');
		if (workingEvent.journalItemId == null) {
			const r = await apiService.saveMeeting(workingEvent);
			setWorkingEvent(prevMeeting => ({ ...prevMeeting, journalItemId: r }));
		} else {
			apiService.updateMeeting(workingEvent);
			workingEvent.notesList = workingEvent.notesList.filter((value, index, arr) => {
				return value.status != 'Deleted';
			})
		}

		props.updateMeetingInList(workingEvent);
	}

	const close = () => {
		setWorkingEvent({ ...workingEvent, mode: 'readonly' });
	}

	const getSlateStructureFromRawDetails = (rawDetails, title) => {
		let template = [{
			type: 'title',
			children: [{ text: title || "Title" }],
		}, {
			type: 'paragraph',
			children: [{ text: rawDetails || "No data" }],
		},]
		return template;
	}

	const deleteWholeJournalItem = () => {
		console.log("delete whole journal item")
		console.log(workingEvent);
		apiService.deleteMeeting(workingEvent.journalItemId);
	}


	const getComponent = () => {
		console.log("working event");
		console.log(workingEvent);
		if (workingEvent != null) {
			if (workingEvent.mode == null || workingEvent.mode === 'readonly') {
				return (
					<fieldset key={workingEvent.meetingId}>
						<p>mode: {mode}</p>
						<legend>[{meeting.journalItemId}] {dtFormated} ({dtDescription}) - {meeting.subject} Treeid:{meeting.treeId}</legend>
						{meeting.notesList?.map(n => {

							let notes = null;
							if (n.notesType == 'Slate') {
								let dt = n.notes;
								try {
									dt = JSON.parse(n.notes)
									notes = { detailsType: '', details: dt, name: n.type, elementId: "qwerty4" }
								} catch (error) {
									notes = { detailsType: '', details: getSlateStructureFromRawDetails(n.notes, "Notes item title (before, after)"), name: n.type, elementId: "qwerty6" }

								}
							}
							else {
								notes = { detailsType: '', details: getSlateStructureFromRawDetails(n.notes, "Notes item title (before, after)"), name: n.type, elementId: "qwerty6" }
							}
							return (<NotesLabel title={n.type} notes={n.notes} selectedElement={notes} readOnly={true} />)
						})}
						<p style={buttonStyle}>
							<Button variant="contained" color="primary" onClick={edit}>Edit</Button>
						</p>
					</fieldset>
				)
			}
			else {
				return (<fieldset>
					<p>Title: {meeting.subject}</p>
					{/* <Notes title='Subject' name='subject' notes={workingEvent.subject} updateState={updateState} /> */}
					<hr></hr>
					{workingEvent.notesList.filter(x => x.status != 'Deleted').map(n => {
						let notes = null;
						if (n.notesType == 'Slate') {
							let dt = n.notes;
							try {
								dt = JSON.parse(n.notes)
								notes = { detailsType: '', details: dt, name: n.type, elementId: "qwerty1" }

							} catch (error) {
								notes = { detailsType: '', details: getSlateStructureFromRawDetails(n.notes, "Notes item title (before, after)"), name: n.type, elementId: "qwerty6" }

							}
						}
						else {
							notes = { detailsType: '', details: getSlateStructureFromRawDetails(n.notes, "Notes item title (before, after)."), name: n.type, elementId: "qwerty2" }
						}
						console.log("notes", notes);
						return (<Notes title={n.type} notes={n.notes} name='notes' guid={n.guid} updateState={updateElementInList} selectedElement={notes} readOnly={false}></Notes>)
					})}

					<Button variant="contained" color="primary" onClick={save}>Save</Button>
					<Button variant="contained" color="primary" onClick={close}>Close</Button>
					<Button variant="outlined" color="primary" onClick={newJournalItemDetails}>Add details</Button>
					<Button variant="outlined" color="primary" onClick={deleteWholeJournalItem}>Delete whole Joural Item</Button>
					{/* <div>{meeting.beforeNotes}</div> */}
				</fieldset>)
			}
		}
	}

	return <div>
		{getComponent()}
	</div>
}

export default MeetingItem;

