import React, {Component} from 'react';
import './App.css';

import MeetingItem from './Components/MeetingItem'

const PATH_BASE='https://localhost:44366/api/';
const PATH_MEETINGS_CONTROLER='Meetings';
const PATH_MEETINGS_ACTION='List';

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
				<div class='Meeting'>
					<span>{item.objectId} </span>
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
		fetch(`${PATH_BASE}${PATH_MEETINGS_CONTROLER}/${PATH_MEETINGS_ACTION}`,{method:'POST'})
		.then(respone=>respone.json())
		.then(result=>this.setMeetings(result))
		.catch(error=>error);
		console.log("Finish post");
	}
}








export default App;
