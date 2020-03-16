import React, {Component} from 'react';
import AutoHideNotes from 'Components/AutoHideNotes'
import Notes from 'Components/Notes';
import NameForm from 'Components/NameForm';
import Button from '@material-ui/core/Button';
import {Link} from "react-router-dom";

class MeetingItem extends Component{
	
	constructor(props){
		super(props);
		this.state={
			notes:'init'
		}
		this.edit=this.edit.bind(this);
		this.renderNotes=this.renderNotes.bind(this);

	}

	renderNotes(title, notes){
		
		if (notes!=""){
			return(<Notes title={title} notes={notes}/>)
		}
	}
	
	render(){
		return (
	
			<fieldset key={this.props.meeting.meetingId} style={{border: 'dotted',borderRadius:'10px', borderWidth:'1px',margin:'10px'}}>
				<legend>{this.props.meeting.Subject}</legend>
				<Link to="Edit">	
					<Button  variant="contained"  color="primary">Edit</Button>
				</Link>
				{/*this.renderNotes('Before notes',this.props.meeting.beforeNotes)*/}
				{/*this.renderNotes('During notes',this.props.meeting.duringnotes)*/}
				{/*this.renderNotes('After notes',this.props.meeting.afterNotes)*/}
				{/*<Button  variant="contained"  color="primary" onClick={()=>this.edit()}>Edit</Button>*/}
				<AutoHideNotes title='Before notes' notes={this.props.meeting.beforeNotes}/>
				<AutoHideNotes title='During notes' notes={this.props.meeting.duringnotes} />
				<AutoHideNotes title='After notes' notes={this.props.meeting.afterNotes}/>
				
				<NameForm/>
			</fieldset>
		
		)
	}
	edit(){
		alert("fdSA");
	}
}

export default MeetingItem;