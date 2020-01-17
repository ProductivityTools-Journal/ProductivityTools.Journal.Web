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
		this.onNotesChanged=this.onNotesChanged.bind(this);
	}
	
	render(){
		return (
			<div>
				<button onClick={()=>this.edit()} type="button"	>Edit</button>
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
}

export default MeetingItem