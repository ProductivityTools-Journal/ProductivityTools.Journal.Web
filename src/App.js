import React, { Component } from 'react';
import './App.css';

import MeetingList from 'Components/MeetingList'
import {
	BrowserRouter as Router,
	Switch,
	Route,
	Link
} from "react-router-dom";
import EditMeeting from 'Components/EditMeeting';
import NewMeeting from 'Components/NewMeeting';
import Home from 'Components/Home';
import Callback from 'Components/Callback';
import OAuthCallback from 'Components/OAuthCallback';

class App extends Component {
	constructor(props) {
		super(props);
		
	}

	render() {
		return (
			<div>
				<div>
					<Link to="/">Home</Link>
					<Link to="/List">List</Link>
					<Link to="New">New</Link>
				</div>
				<Switch>
					<Route path="/New/:TreeId">
						<NewMeeting />
					</Route>
					<Route path="/Edit/:Id" render={(props) => (<EditMeeting {...props} key={this.props.Id} />)}></Route>
					<Route path="/List/:TreeId" render={(props => <MeetingList auth={this.auth} {...props} />)}></Route>
					<Route path="/List/" exact="true" render={(props => <MeetingList auth={this.auth} {...props} />)}></Route>
					<Route path="/">
						<Home auth={this.auth} {...this.props} />
					</Route>

				</Switch>

			</div>
		)
	}
}

export default App;
