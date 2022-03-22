import React, { Component } from 'react';
import './App.css';

import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";

import JournalItemEdit from 'Components/JournalItemEdit';
//import NewMeeting from 'Components/NewItem';
import Home from 'Components/Home';
import Main from 'Components/Main'

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


class App extends Component {

	render() {
		return (
			<div>
				<div>
					<Link to="/">Home1</Link>
					<Link to="/List">List</Link>
				</div>
				<Router>
					<Routes>
						<Route path="/Edit/:Id" render={(props) => (<JournalItemEdit {...props} key={this.props.Id} />)}></Route>
						<Route path="/List/:TreeId" render={(props => <Main auth={this.auth} {...props} />)}></Route>
						<Route path="/List/" exact render={(props => <Main auth={this.auth} {...props} />)}></Route>
						<Route path="/">
							<Home auth={this.auth} {...this.props} />
						</Route>
					</Routes>
				</Router>
				<ToastContainer />
			</div>
		)
	}
}

export default App;
