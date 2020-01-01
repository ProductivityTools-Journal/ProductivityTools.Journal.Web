import React, {Component} from 'react';
import './App.css';



const list=[
	{
		title:'React',
		author:'React author',
		objectId:1
	},
	{
		title:'Node',
		author:'Node author',
		objectId:2
	}
]

function App() {
  return (
    <div className="App">
	{list.map(function(item){
		return (
		<div>
			<span>{item.objectId} </span>
			<span>{item.title}</span>
			
			<MeetingItem/>
		</div>
		);
	})}
	
    </div>
  );
}

class MeetingItem extends Component{
	
	constructor(props){
		super(props);
		this.edit=this.edit.bind(this);
	}
	
	render(){
		return (
			<div>
				<button onClick={()=>this.edit()} type="button"	>Edit</button>
				<span>Meeting Item</span>
				<Notes/>
				<Notes/>
				<Notes/>
			</div>
		)
	}
	
	edit(){
		alert("fdSA");
	}
}

class Notes extends Component{
	
	constructor(props){
		super(props);
		this.state={
			title:'ddd'
		}
	}
	
	render(){
		return (
			<div>
				<p>{this.state.title}</p>
				<p><input type="text"></input></p>
			</div>
		)
	}
}

export default App;
