import React, { Component } from 'react';
import TextField from '@material-ui/core/TextField'

class Notes extends Component {

	constructor(props) {
		super(props);
		this.state = {
			title: props.title,
			notes: props.notes ? props.notes : "",
			updateState: props.updateState
		}
		console.log("constructor called");
		this.onNotesChanged = this.onNotesChanged.bind(this);
	}

	render() {
		return (
			<div>

				<TextField
					label={this.state.title}
					name={this.props.name}
					value={this.state.notes}
					onChange={this.onNotesChanged}
	
					style={{marginTop: '10px', marginBottom:'10px'}}
					multiline
					fullWidth
					variant="outlined"

				/>
				
				{/*<p><input type="text" name={this.props.name} value={this.state.notes} onChange={this.onNotesChanged} /></p>*/}
				{/*<p>{this.state.notes}</p>*/}
			</div>
		)
	}


	onNotesChanged(event) {
		this.state.updateState(event);
		this.setState({ notes: event.target.value });
		console.log(event.target.value);
	}
}

export default Notes;