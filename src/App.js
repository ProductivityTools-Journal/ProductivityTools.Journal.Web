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
				<Notes title='Before notes'/>
				<Notes title='During notes'/>
				<Notes title='After notes'/>
				<NameForm/>
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
			notes:'',
		};
		console.log("constructor called");
		this.noteschanged=this.noteschanged.bind(this);
	}
	
	render(){
		const {title}=this.props;
		return (
			<div>
				<p>{title}</p>
				<p><input type="text" value={this.state.notes} onChange={this.noteschanged}></input></p>
				<p>{this.state.notes}</p>
			</div>
		)
	}

	noteschanged(event){
		this.setState({notes:event.target.value});
		console.log("title changed"+event.target.value);
	}
}


class NameForm extends React.Component {
	constructor(props) {
	  super(props);
	  this.state = {value: ''};
  
	  this.handleChange = this.handleChange.bind(this);
	  this.handleSubmit = this.handleSubmit.bind(this);
	}
  
	handleChange(event) {
	  this.setState({value: event.target.value});
	}
  
	handleSubmit(event) {
	  alert('Podano następujące imię: ' + this.state.value);
	  event.preventDefault();
	}
  
	render() {
	  return (
		<form onSubmit={this.handleSubmit}>
		  <label>
			Imię:
			<input type="text" value={this.state.value} onChange={this.handleChange} />
		  </label>
		  <input type="submit" value="Wyślij" />
		</form>
	  );
	}
  }

export default App;
