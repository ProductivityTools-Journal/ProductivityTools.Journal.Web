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

	return (
		<div>
			<SlateEditor selectedElement={props.selectedElement} readOnly={props.readOnly} detailsChanged={onSlateChanged}></SlateEditor>
		</div>
	)
}

export default Notes;