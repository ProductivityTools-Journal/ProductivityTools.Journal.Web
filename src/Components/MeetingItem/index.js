import React, {Component} from 'react';
import Notes from '../Notes';

class MeetingItem extends Component{
	
	constructor(props){
		super(props);
		this.state={
			notes:'init'
		}
		this.edit=this.edit.bind(this);
		this.onNotesChanged=this.onNotesChanged.bind(this);
	}
	
	render(){
		return (
			<div>
				<button onClick={()=>this.edit()} type="button"	>Edit</button>
				<span>Meeting Item</span>
				<Notes title='Before notes' notes={this.props.meeting.beforeNotes} onNotesChanged={this.onNotesChanged}/>
				<Notes title='During notes' notes={this.props.meeting.duringNotes}/>
				<Notes title='After notes' notes={this.props.meeting.afterNotes}/>
			</div>
		)
	}

	onNotesChanged(event){
		this.setState({notes:event.target.value});
		console.log(event.target.value);
	}
	
	edit(){
		alert("fdSA");
	}
}

export default MeetingItem