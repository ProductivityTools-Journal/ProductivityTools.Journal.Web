import React, { Component } from 'react';
import TextField from '@material-ui/core/TextField'

function Notes(props) {
	const onNotesChanged = (event) => {
		this.state.updateState(event);
		this.setState({ notes: event.target.value });
		console.log(event.target.value);
	}

	return (
		<div>
			<TextField
				label={props.title}
				name={props.name}
				value={props.notes}
				onChange={props.updateState}

				style={{ marginTop: '10px', marginBottom: '10px' }}
				multiline
				fullWidth
				variant="outlined"

			/>
		</div>
	)



}

export default Notes;