import React, { Component } from 'react';
import AutoHideNotes from 'Components/AutoHideNotes'
import Button from '@material-ui/core/Button';
import { Link } from "react-router-dom";
import * as moment from 'moment';

class MeetingItem extends Component {

	constructor(props) {
		super(props);
		this.state = {
			notes: 'init'
		}
	}

	render() {

		let mt = moment(this.props.meeting.date);
		let dtDescription = mt.fromNow();
		let dtFormated = mt.format('YYYY.MM.DD hh:mm')
		const buttonStyle={textAlign:'right'}
		return (
			<fieldset  key={this.props.meeting.meetingId}>
				<legend>[{this.props.meeting.meetingId}] {dtFormated} ({dtDescription}) - {this.props.meeting.subject} Treeid:{this.props.meeting.treeId}</legend>
				
				{/*<Button  variant="contained"  color="primary" onClick={()=>this.edit()}>Edit</Button>*/}
				<AutoHideNotes title='Before notes' notes={this.props.meeting.beforeNotes} />
				<AutoHideNotes title='During notes' notes={this.props.meeting.duringNotes} />
				<AutoHideNotes title='After notes' notes={this.props.meeting.afterNotes} />
				<p style={buttonStyle}>
					<Link to={`/Edit/${this.props.meeting.meetingId}`}>
						<Button variant="contained" color="primary">Edit</Button>
					</Link>
				</p>	
			</fieldset>
		)
	}
}

export default MeetingItem;