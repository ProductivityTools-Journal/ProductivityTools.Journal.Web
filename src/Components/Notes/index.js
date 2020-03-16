import React, { Component } from 'react';

class Notes extends Component {

	constructor(props) {
		super(props);
		this.state = {
			title: props.title,
			notes: props.notes ? props.notes : ""
		}
		console.log("constructor called");
		this.onNotesChanged = this.onNotesChanged.bind(this);
	}

	render() {
		return (
			<div>
				<p>{this.state.title}</p>
				<p><input type="text" value={this.state.notes} onChange={this.onNotesChanged} /></p>
				<p>{this.state.notes}</p>
			</div>
		)
	}


	onNotesChanged(event) {

		this.setState({ notes: event.target.value });
		console.log(event.target.value);
	}
}

export default Notes;