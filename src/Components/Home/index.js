import React, { Component } from 'react'
import { Link } from 'react-router-dom';
import { AuthService } from '../../OAuth/OAuth';
import * as Consts from 'Consts';
import * as moment from 'moment';

class Home extends Component {

    constructor(props) {
        super(props);
        this.authService = new AuthService();
        this.state = {
            date: null,
            userAuthenticated: false
        }
    }

    login = () => {
        this.authService.login();
    }

    logout = () => {
        this.authService.logout();
    }

    loadDate = (date) => {

        this.setState({ date });
    }

    componentDidMount() {
        debugger;
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


        this.authService.getUser().then(user => {
            debugger;
            if (user == null) {
                this.setState({ userAuthenticated: false });
            }
           else {
               this.setState({ userAuthenticated: true });
            }
           console.log(user);
       })
    }


    render() {
        //const { isAuthenticated, login, logout } = this.props.auth;
        let mt = moment(this.state.date);
        let dtFormated = mt.format('YYYY.MM.DD hh:mm:ss')       
        return (
            <div>
                <p>Welcome on home page of ProductivityTools.Meeting</p>
                <p>{this.state.date ? `Server responded with date ${dtFormated}` : "Server hasn't responded yet"}</p>
                {this.state.userAuthenticated ? (<Link to="/List">List</Link>) : <p></p>}
                <button onClick={this.state.userAuthenticated  ? this.logout : this.login}>{this.state.userAuthenticated? "Log out" : "Log in"}</button> 
            </div >
        )
    }
}

export default Home;