import React, { Component } from 'react';
import './App.css';

import MeetingList from 'Components/MeetingList'
import {
	Switch,
	Route,
	Link
} from "react-router-dom";
import EditMeeting from 'Components/EditMeeting';
//import NewMeeting from 'Components/NewItem';
import Home from 'Components/Home';
import Main from 'Components/Main'


class App extends Component {

	render() {
		return (
			<div>
				<div>
					<Link to="/">Home</Link>
					<Link to="/List">List</Link>
				</div>
				<Switch>
					{/* <Route path="/New/:TreeId">
						<NewMeeting />
					</Route> */}
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

export default App;
