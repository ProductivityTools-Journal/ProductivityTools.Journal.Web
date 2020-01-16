import React, {Component} from 'react';

class Notes extends Component{
	
	constructor(props){
		super(props);
		console.log("constructor called");
	}
	
	render(){
		const {title,notes,onNotesChanged}=this.props;
		return (
			<div>
				<p>{title}</p>
				<p><input type="hidden" value={notes} onChange={onNotesChanged}></input></p>
				<p>{notes}</p>
			</div>
		)
	}
}

export default Notes;