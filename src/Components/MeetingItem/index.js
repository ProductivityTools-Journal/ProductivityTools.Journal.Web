import React, {Component} from 'react';
import Notes from 'Components/Notes';
import NameForm from 'Components/NameForm';
import Button from '@material-ui/core/Button';;

class MeetingItem extends Component{
	
	constructor(props){
		super(props);
		this.state={
			notes:'init'
		}
		this.edit=this.edit.bind(this);

	}
	
	render(){
		return (
			<div key={this.props.meeting.meetingId}>
				<Button  variant="contained"  color="primary" onClick={()=>this.edit()} >Edit</Button>
				<span>Meeting Item</span>
				<Notes title='Before notes' notes={this.props.meeting.beforeNotes}/>
				<Notes title='During notes' notes={this.props.meeting.duringnotes} />
				<Notes title='After notes' notes={this.props.meeting.afterNotes}/>
				<NameForm/>
			</div>
		)
	}
	edit(){
		alert("fdSA");
	}
}

export default MeetingItem;