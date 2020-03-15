import React, {Component} from 'react';
import './App.css';

import MeetingList from 'Components/MeetingList'
import {
	BrowserRouter as Router,
	Switch,
	Route,
	Link
  } from "react-router-dom";
import EditMeeting from 'Components/EditMeeting';


class App extends Component {
	render (){	
		return(
			<div>
				<div>
					<Link to="/">List</Link>
					<Link to="Edit">New</Link>
				</div>
				<Switch>
					<Route path="/Edit">
						<EditMeeting/>
					</Route>
					<Route path="/">
						<MeetingList/>
					</Route>				
				</Switch>	
				
			</div>			
		)
	}
}

export default App;
