import React, { Component } from 'react';
import TextField from '@material-ui/core/TextField'

function Notes(props) {
	const onNotesChanged = (event) => {
		console.log(`guid: ${props.guid}`);
		console.log(`update value: ${event.target.value}`);
		props.updateState(event, props.guid);
	}

	return (
		<div>
			<TextField
				label={`type: ${props.title}`}
				name={props.name}
				guid={props.guid}
				value={props.notes}
				onChange={onNotesChanged}

				style={{ marginTop: '10px', marginBottom: '10px' }}
				multiline
				fullWidth
				variant="outlined"

			/>
		</div>
	)
}

export default Notes;