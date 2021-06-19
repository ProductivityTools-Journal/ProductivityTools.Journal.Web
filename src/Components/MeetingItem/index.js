<<<<<<< HEAD
import React, {Component} from 'react';
import Notes from '../Notes';

class MeetingItem extends Component{
	
	constructor(props){
		super(props);
		this.state={
			notes:'init',
			readonly:1
		}
		this.edit=this.edit.bind(this);
		this.save=this.save.bind(this);
		this.onNotesChanged=this.onNotesChanged.bind(this);
	}
	
	render(){
		return (
			<div>
				{ 
					this.state.readonly
					?<button onClick={()=>this.edit()} type="button">Edit</button>
					:<button onClick={()=>this.save()} type="button">Save</button>
				}
				<span>Meeting Item</span>
				<Notes title='Before notes' notes={this.props.meeting.beforeNotes} onNotesChanged={this.onNotesChanged} readonly={this.state.readonly} />
				<Notes title='During notes' notes={this.props.meeting.duringNotes} readonly={this.state.readonly}/>
				<Notes title='After notes' notes={this.props.meeting.afterNotes} readonly={this.state.readonly}/>
			</div>
		)
	}

	onNotesChanged(event){
		this.setState({notes:event.target.value});
		console.log(event.target.value);
	}
	
	edit(){
		this.setState({readonly:0});
	}

	save(){
		this.setState({readonly:1});
	}
}

export default MeetingItem
=======
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
>>>>>>> 1a8ec8c0e1383948bc3793ae3b5e482bffca438f
