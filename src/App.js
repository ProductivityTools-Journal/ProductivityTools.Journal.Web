import React, { Component } from 'react';
import './App.css';

<<<<<<< HEAD
import MeetingItem from './Components/MeetingItem'

const PATH_BASE='https://localhost:44366/api/';
const PATH_MEETINGS_CONTROLER='Meetings';
const PATH_MEETINGS_ACTION='List';
=======
import MeetingList from 'Components/MeetingList'
import {
	Switch,
	Route,
	Link
} from "react-router-dom";
import EditMeeting from 'Components/EditMeeting';
import NewMeeting from 'Components/NewMeeting';
import Home from 'Components/Home';
import Main from 'Components/Main'
>>>>>>> 1a8ec8c0e1383948bc3793ae3b5e482bffca438f


class App extends Component {

<<<<<<< HEAD
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








=======
	render() {
		return (
			<div>
				<div>
					<Link to="/">Home</Link>
					<Link to="/List">List</Link>
				</div>
				<Switch>
					<Route path="/New/:TreeId">
						<NewMeeting />
					</Route>
					<Route path="/Edit/:Id" render={(props) => (<EditMeeting {...props} key={this.props.Id} />)}></Route>
					<Route path="/List/:TreeId" render={(props => <Main auth={this.auth} {...props} />)}></Route>
					<Route path="/List/" exact render={(props => <Main auth={this.auth} {...props} />)}></Route>
					<Route path="/">
						<Home auth={this.auth} {...this.props} />
					</Route>

				</Switch>

			</div>
		)
	}
}

>>>>>>> 1a8ec8c0e1383948bc3793ae3b5e482bffca438f
export default App;
