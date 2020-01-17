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