import React, { Component, useState, useEffect } from 'react'
import { Link } from 'react-router-dom';
import { AuthService } from '../../OAuth/OAuth';
import * as Consts from 'Consts';
import { config } from 'Consts';
import * as moment from 'moment';
import * as apiService from 'services/apiService'

export default function Home() {


    let authService = new AuthService();
    const [date, setDate] = useState();
    const [userAuthenticated, setUserAuthenticated] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const data = await apiService.getDate();
            setDate(data);
        }

        authService.getUser().then(user => {

            if (user == null) {
                setUserAuthenticated(false);
            }
            else {
                setUserAuthenticated(true);
            }
            console.log(user);
        })
        fetchData();
    },[]);

    const login = () => {
        authService.login();
    }

    const logout = () => {
        authService.logout();
    }

    const loadDate = (date) => {
        setDate( date );
    }

    // componentDidMount() {

    //     console.log("calling endpoint to get current date");
    //     var date = await apiService.getDate();
    //     // fetch(`${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETINGS_DATE}`, {
    //     //     mode: 'cors',
    //     //     crossDomain: true,
    //     //     method: 'POST',
    //     //     headers: { 'Content-Type': 'application/json' }
    //     // })
    //     //     .then(respone => respone.json())
    //     //     .then(result => this.loadDate(result))
    //     //     .catch(error => error);
    //     // console.log("Finish post");


    //     this.authService.getUser().then(user => {

    //         if (user == null) {
    //             this.setState({ userAuthenticated: false });
    //         }
    //         else {
    //             this.setState({ userAuthenticated: true });
    //         }
    //         console.log(user);
    //     })
    // }


    console.log("User");
    console.log(authService.getUser());
    //const { isAuthenticated, login, logout } = this.props.auth;
    let mt = moment(date);
    let dtFormated = mt.format('YYYY.MM.DD hh:mm:ss')


    return (
        <div>
            <p>Welcome on home page of ProductivityTools.Meeting</p>
            <p>{date ? `Server responded with date ${dtFormated}` : "Server hasn't responded yet"}</p>
            {userAuthenticated ? (<Link to="/List">List</Link>) : <p></p>}
            <button onClick={userAuthenticated ? logout : login}>{userAuthenticated ? "Log out" : "Log in"}</button>
        </div >
    )
}
