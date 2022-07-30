import React from 'react';
import TextField from '@mui/material/TextField'
import SlateEditor from 'Components/SlateEditor';


function Notes(props) {

	const onNotesChanged = (event) => {
		if (props.guid) {
			console.log(`guid: ${props.guid}`);
			console.log(`update value: ${event.target.value}`);
			props.updateState(event.target.value, props.guid, 'notes');
		}
		else {
			props.updateState(event);
		}
	}

	const onSlateChanged = (newValue) => {
		if (props.guid) {
			let newValueJsoned = JSON.stringify(newValue)
			props.updateState(newValueJsoned, props.guid, 'notes');
			console.log("onSlateChagne");
		}
		else {
			console.log("something is missing here");
		}
	}

	const deleteNotes = (event) => {
		debugger;
		console.log(`guid: ${props.guid}`);
		console.log(`update value: ${event.target.value}`);
		props.updateState('Deleted', props.guid, 'status');
	}

	return (
		<div>
			<SlateEditor selectedElement={props.selectedElement} readOnly={props.readOnly} detailsChanged={onSlateChanged}></SlateEditor>

			{/* <TextField
				label={`type: ${props.title}`}
				name={props.name}
				guid={props.guid}
				value={props.notes}
				onChange={onNotesChanged}

				style={{ marginTop: '10px', marginBottom: '10px' }}
				multiline
				fullWidth
				variant="outlined"

			/> */}
			<button onClick={deleteNotes}>Delete</button>
		</div>
	)
}

export default Notes;