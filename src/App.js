import React, {Component} from 'react';
import './App.css';
import Button from '@material-ui/core/Button';


//const PATH_BASE='http://productivitytools.tech:8081/api/	';
const PATH_BASE='https://localhost:5001/api/';
const PATH_MEETINGS_CONTROLER='Meetings';
const PATH_MEETINGS_ACTION='List';


class App extends Component {

	constructor(props) {
		super(props);
		this.state={
			meetings:[]
		}

		this.setMeetings=this.setMeetings.bind(this);
	}	

  	render (){	
		const{meetings}=this.state;
		//because render is before compnentDidMount
		if(!meetings){return null}
		
	  	return(		
    		<div className="App">
			{this.state.meetings.map(function(item){
				
				return (
				<div key={item.meetingId}>
					<span>CXX</span>
					<span>{item.meetingId} </span>
					<span>{item.subject}</span>
				
					<MeetingItem meeting={item}/>
				</div>
				);
			})}
	
   			 </div>
 		);
	}

	setMeetings(meetings){
		console.log(meetings)
		this.setState({meetings});
	}

	componentDidMount(){


		console.log("Post");
		fetch(`${PATH_BASE}${PATH_MEETINGS_CONTROLER}/${PATH_MEETINGS_ACTION}`,{
			mode: 'cors',
			crossDomain:true,
			method:'POST',
			headers: {'Content-Type':'application/json'},
			body: JSON.stringify("SS")
	
		})
		.then(respone=>respone.json())
		.then(result=>this.setMeetings(result))
		.catch(error=>error);
		console.log("Finish post");
	}
}


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

class Notes extends Component{
	
	constructor(props){
		super(props);
		this.state={title:props.title,
			 notes:props.notes?props.notes:""}
		console.log("constructor called");
		this.onNotesChanged=this.onNotesChanged.bind(this);
	}
	
	render(){
		if (this.state.notes==="")
		{
			return null;
		}
		else
		{
		return (
			<div>
				<p>{this.state.title}</p>
				<p><input type="text" value={this.state.notes} onChange={this.onNotesChanged}/></p>
				<p>{this.state.notes}</p>
			</div>
		)
		}
	}

	onNotesChanged(event){

		this.setState({notes:event.target.value});
		console.log(event.target.value);
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
