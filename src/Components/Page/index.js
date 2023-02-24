import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import * as moment from 'moment';
import NotesLabel from 'Components/NotesLabel'
import Notes from 'Components/Notes'
import * as apiService from 'services/apiService'
import { v4 as uuid } from 'uuid';
import { useDrag } from 'react-dnd'
import * as Common from '../Common.js'


function Page({ page, updatePageInList, key }) {

	//const { meeting, ...rest } = props;
	const [localPageObject, setLocalPageObject] = useState();


	useEffect(() => {
		setLocalPageObject({ ...page });
	}, [page]);

	const [mode, setMode] = useState('readonly');
	let mt = moment(page.date);
	let dtDescription = mt.fromNow();
	let dtFormated = mt.format('YYYY.MM.DD hh:mm')
	const buttonStyle = { textAlign: 'left' }
	//console.log("Pagemeeting");
	//console.log(page);

	const edit = () => {
		//console.log()
		//setMode('edit');
		setLocalPageObject({ ...localPageObject, mode: 'edit' });
	}

	const updateState = (event) => {
		const value = event.target.value;
		const name = event.target.name
		setLocalPageObject(prev => ({ ...prev, [name]: value }));
	}

	const updateElementInList = (value, journalItemDetailsGuid, field) => {
		let journalItemDetailNotes = value;
		let notes = localPageObject.contentList;
		var editedElement = notes.find(x => x.guid === journalItemDetailsGuid);
		editedElement[field] = journalItemDetailNotes;
		setLocalPageObject(prevMeeting => ({ ...prevMeeting, notesList: notes }));
	}
	// const newJournalItemDetails = () => {
	// 	let newNotesList = [...localPageObject.contentList, { type: 'new', notes: 'Add notes here', guid: uuid(), status: 'New' }]
	// 	setLocalPageObject(prevlocalPageObject => ({ ...prevlocalPageObject, notesList: newNotesList }));
	// }


	const save = async () => {
		let eventSum = undefined;//we need it to keep mode=edit, which is not returned from server
		debugger;
		localPageObject.contentType = 'Slate';
		if (localPageObject.pageId == null) {
			let savedEvent = await apiService.savePage(localPageObject);
			eventSum = { ...localPageObject, ...savedEvent }
			setLocalPageObject(eventSum);
		} else {
			apiService.updateJournal(localPageObject);
		}
		updatePageInList(eventSum);
	}

	const close = () => {
		setLocalPageObject({ ...localPageObject, mode: 'readonly' });
	}



	const deletePage = () => {
		//console.log("delete whole journal item")
		//console.log(localPageObject);
		apiService.deleteMeeting(localPageObject.journalItemId);
		removePageFromList(localPageObject);
	}

	const removePageFromList = (page) => {
		page.Deleted = true;
		updatePageInList(page);
	}

	const [{ isDragging }, drag] = useDrag(() => ({
		type: 'page',
		item: { page: page, removePageFromList: removePageFromList },
		collect: monitor => ({
			isDragging: !!monitor.isDragging(),
		})
	}))


	const getComponent = () => {
		//console.log("working event");
		//console.log(page);
		if (page != null) {

			let notes = null;
			if (page.contentType == 'Slate') {
				let dt = page.content;
				try {
					dt = JSON.parse(page.content)
					notes = dt;
				} catch (error) {
					notes = Common.getStringSlateStructureFromRawDetails(page.content, "XXXX2s");

				}
			}
			else {
				notes = Common.getStringSlateStructureFromRawDetails(page.content, "XXX1");
			}

			if (page.mode == null || page.mode === 'readonly') {
				return (
					<fieldset key={page.journalId} ref={drag}>
						<p>mode: {mode}  <span>{isDragging && '😱'}</span></p>
						<legend>[{page.pageId}] {dtFormated} ({dtDescription}) - {page.subject} Treeid:{page.journalId}</legend>
						<NotesLabel pageJsonContent={notes} readOnly={true} />
						<p style={buttonStyle}>
							<Button variant="contained" color="primary" onClick={edit}>Edit</Button>
						</p>
					</fieldset>
				)
			}
			else {
				
				return (<fieldset>
					<p>Title: {page.subject}</p>
					{/* <Notes title='Subject' name='subject' notes={localPageObject.subject} updateState={updateState} /> */}
					<hr></hr>
					<Notes notes={notes} name='notes' guid={notes.guid} updateState={updateElementInList} selectedElement={notes} readOnly={false}></Notes>)


					<Button variant="contained" color="primary" onClick={save}>Save</Button>
					<Button variant="contained" color="primary" onClick={close}>Close</Button>
					<Button variant="outlined" color="primary" onClick={deletePage}>Delete page</Button>
					{/* <div>{meeting.beforeNotes}</div> */}
				</fieldset>)
			}
		}
	}

	return <div>
		{getComponent()}
	</div>
}

export default Page;

