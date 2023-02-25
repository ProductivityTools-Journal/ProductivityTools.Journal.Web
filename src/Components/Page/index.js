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
		apiService.deleteMeeting(localPageObject.pageId);
		setLocalPageObject({ ...localPageObject, Deleted: true });
		//removePageFromList(localPageObject);
	}

	const removePageFromList = (page) => {
		page.Deleted = true;
		updatePageInList(page);
		setLocalPageObject(page);
	}

	const [{ isDragging }, drag] = useDrag(() => ({
		type: 'page',
		item: { page: page, removePageFromList: removePageFromList },
		collect: monitor => ({
			isDragging: !!monitor.isDragging(),
		})
	}))

	const checkState = () => {
		console.log(page)
	}

	const pageObjectContentChanged = (page) => {
		console.log("pageObjectContentChanged");
		console.log(page);

	}

	const getComponent = () => {
		//console.log("working event");
		//console.log(page);
		if (localPageObject != null) {

			let pageObjectContent = null;
			if (localPageObject.contentType == 'Slate') {
				let dt = localPageObject.content;
				try {
					dt = JSON.parse(localPageObject.content)
					pageObjectContent = dt;
				} catch (error) {
					pageObjectContent = Common.getStringSlateStructureFromRawDetails(localPageObject.content, "XXXX2s");

				}
			}
			else {
				pageObjectContent = Common.getStringSlateStructureFromRawDetails(localPageObject.content, "XXX1");
			}

			if (localPageObject.mode == null || localPageObject.mode === 'readonly') {
				return (
					<fieldset key={localPageObject.pageId} ref={drag}>
						<p>mode: {mode}  <span>{isDragging && '😱'}</span></p>
						<legend>[{localPageObject.pageId}] {dtFormated} ({dtDescription}) - {localPageObject.subject} Treeid:{localPageObject.journalId}</legend>
						<NotesLabel pageObjectContent={pageObjectContent} readOnly={true} />
						<p style={buttonStyle}>
							<Button variant="contained" color="primary" onClick={edit}>Edit</Button>
						</p>
					</fieldset>
				)
			}
			else {

				return (<fieldset>
					<p>Title: {localPageObject.subject}</p>
					<p>PageId: {localPageObject.pageId}</p>
					{/* <Notes title='Subject' name='subject' notes={localPageObject.subject} updateState={updateState} /> */}
					<hr></hr>
					{/* <Notes notes={notes} name='notes' guid={notes.guid} updateState={updateElementInList} selectedElement={notes} readOnly={false}></Notes>) */}
					<NotesLabel pageObjectContent={pageObjectContent} readOnly={false} pageObjectContentChanged={pageObjectContentChanged} />

					<Button variant="contained" color="primary" onClick={save}>Save</Button>
					<Button variant="contained" color="primary" onClick={close}>Close</Button>
					<Button variant="outlined" color="primary" onClick={deletePage}>Delete page</Button>
					<Button variant="outlined" color="primary" onClick={checkState}>CheckState</Button>
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

