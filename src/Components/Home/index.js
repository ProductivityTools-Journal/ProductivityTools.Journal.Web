import React, { Component } from 'react'
import { Link } from 'react-router-dom';

class Home extends Component {


    render() {
        const { isAuthenticated, login, logout } = this.props.auth;
        return (
            <div>
                <p>Welcome on home page of ProductivityTools.Meeting</p>
                {isAuthenticated() ? (<Link to="/List">List</Link>) : <p></p>}
                <button onClick={isAuthenticated()?logout:login}>{isAuthenticated() ? "Log out" : "Log in"}</button>
            </div >
        )
    }
}

export default Home;