import React, { useState } from 'react';
import AutoHideNotes from 'Components/AutoHideNotes'
import Button from '@material-ui/core/Button';
import { Link } from "react-router-dom";
import * as moment from 'moment';


function MeetingItem(props) {

	const [notes, setNotes] = useState('init');
	let mt = moment(props.meeting.date);
	let dtDescription = mt.fromNow();
	let dtFormated = mt.format('YYYY.MM.DD hh:mm')
	const buttonStyle = { textAlign: 'left' }
	return (
		<fieldset key={props.meeting.meetingId}>
			<legend>[{props.meeting.meetingId}] {dtFormated} ({dtDescription}) - {props.meeting.subject} Treeid:{props.meeting.treeId}</legend>

			{/*<Button  variant="contained"  color="primary" onClick={()=>this.edit()}>Edit</Button>*/}
			<AutoHideNotes title='Before notes' notes={props.meeting.beforeNotes} />
			<AutoHideNotes title='During notes' notes={props.meeting.duringNotes} />
			<AutoHideNotes title='After notes' notes={props.meeting.afterNotes} />
			<p style={buttonStyle}>
				{/*<Link to={`/Edit/${props.meeting.meetingId}`}>*/}
				<Button variant="contained" color="primary" onClick={() => props.onMeetingEdit(props.meeting.meetingId)}>Edit</Button>
				{/*</Link>*/}
			</p>
		</fieldset>

	)
}

export default MeetingItem;
