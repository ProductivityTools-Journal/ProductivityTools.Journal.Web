import React, { Component } from 'react'
import { Link } from 'react-router-dom';

class Home extends Component {

    
render() {
    const { isAuthenticated, login } = this.props.auth;
    return (
        <div>
            <p>Welcome on home page of ProductivityTools.Meeting</p>
            {isAuthenticated() ? (<Link to="/List">List</Link>) : (<button onClick={this.props.auth.login}>Log in</button>)}
        </div>
    )
}
}

export default Home;