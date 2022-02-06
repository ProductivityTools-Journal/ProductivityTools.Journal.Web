import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import { Link } from "react-router-dom";
import * as moment from 'moment';
import NotesLabel from 'Components/NotesLabel'



function MeetingItem(props) {

	const [notes, setNotes] = useState('init');
	let mt = moment(props.meeting.date);
	let dtDescription = mt.fromNow();
	let dtFormated = mt.format('YYYY.MM.DD hh:mm')
	const buttonStyle = { textAlign: 'left' }
	console.log("meeting");
	console.log(props.meeting);

	return (
		<fieldset key={props.meeting.meetingId}>
			<legend>[{props.meeting.meetingId}] {dtFormated} ({dtDescription}) - {props.meeting.subject} Treeid:{props.meeting.treeId}</legend>
			{props.meeting.notesList?.map(n => {
				return (<NotesLabel title={n.type} notes={n.notes} />)
			})}
			{/*<Button  variant="contained"  color="primary" onClick={()=>this.edit()}>Edit</Button>*/}
			<p style={buttonStyle}>
				{/*<Link to={`/Edit/${props.meeting.meetingId}`}>*/}
				<Button variant="contained" color="primary" onClick={() => props.onMeetingEdit(props.meeting.meetingId)}>Edit</Button>
				{/*</Link>*/}
			</p>
		</fieldset>

	)
}

export default MeetingItem;
