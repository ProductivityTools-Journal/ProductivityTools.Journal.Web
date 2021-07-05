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
            console.log("uu");
            console.log(user);
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


    console.log("User");
    console.log(authService.getUser());
    let mt = moment(date);
    let dtFormated = mt.format('YYYY.MM.DD hh:mm:ss')


    return (
        <div>
            <p>Welcome on home page of ProductivityTools.Meeting :-)</p>
            <p>{date ? `Server responded with date ${dtFormated}` : "Server hasn't responded yet"}</p>
            {userAuthenticated ? (<Link to="/List">List</Link>) : <p></p>}
            <button onClick={userAuthenticated ? logout : login}>{userAuthenticated ? "Log out" : "Log in"}</button>
        </div >
    )
}
