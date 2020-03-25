import React, { Component } from 'react'
import { Link } from 'react-router-dom';
import * as Consts from 'Consts'
import * as moment from 'moment';

class Home extends Component {

    constructor(props) {
        super(props);
        this.state = { date: null }
    }

    loadDate = (date) => {
       
        this.setState({ date });
    }

    componentDidMount() {
        console.log("calling endpoint to get current date");
        fetch(`${Consts.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETINGS_DATE}`, {
            mode: 'cors',
            crossDomain: true,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        })
            .then(respone => respone.json())
            .then(result => this.loadDate(result))
            .catch(error => error);
        console.log("Finish post");
    }


    render() {
        const { isAuthenticated, login, logout } = this.props.auth;
        let mt = moment(this.state.date);
        let dtFormated = mt.format('YYYY.MM.DD hh:mm:ss')
        return (

            <div>

                <p>Welcome on home page of ProductivityTools.Meeting</p>
                <p>{this.state.date ? `Server responded with date ${dtFormated}` : "Server hasn't responded yet"}</p>
                {isAuthenticated() ? (<Link to="/List">List</Link>) : <p></p>}
                <button onClick={isAuthenticated() ? logout : login}>{isAuthenticated() ? "Log out" : "Log in"}</button>
            </div >
        )
    }
}

export default Home;