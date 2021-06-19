<<<<<<< HEAD
import React, {Component} from 'react';

class Notes extends Component{
	
	constructor(props){
		super(props);
		console.log("constructor called");
	}
	
	render(){
		const {title,notes,onNotesChanged,readonly}=this.props;
		return (
			<div>
				{readonly
				? <fieldset class='NotesReadOnly'>
					<legend>{title}</legend>
					{notes}
					</fieldset>
				
				: <input value={notes} onChange={onNotesChanged}></input>
	}
			</div>
		)
	}
=======
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
>>>>>>> 1a8ec8c0e1383948bc3793ae3b5e482bffca438f
}

export default Notes;