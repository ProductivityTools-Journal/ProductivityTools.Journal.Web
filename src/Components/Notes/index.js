import React, {Component} from 'react';

class Notes extends Component{
	
	constructor(props){
		super(props);
		console.log("constructor called");
	}
	
	render(){
		const {title,notes,onNotesChanged,readonly}=this.props;
		return (
			<div>
				<p>{title}</p>
				{readonly
				? <p>{notes}</p>
				: <input  value={notes} onChange={onNotesChanged}></input>
	}
			</div>
		)
	}
}

export default Notes;