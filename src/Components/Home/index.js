import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom';

import * as moment from 'moment';
import * as apiService from 'services/apiService'
import { auth, logout } from '../../Session/firebase'

export default function Home() {


    const [date, setDate] = useState();
    const navigate = useNavigate();
    useEffect(() => {
        const fetchData = async () => {
            const data = await apiService.getDate();
            setDate(data);
        }
        fetchData();
    }, []);

    // const login = () => {
    // }

    const buttonLogout = () => {
        logout();
        navigate("/Login")
    }

    let mt = moment(date);
    let dtFormated = mt.format('YYYY.MM.DD hh:mm:ss')


    return (
        <div>
            <p>Welcome on home page of ProductivityTools.Journal3.2</p>
            <p>{date ? `Server responded with date ${dtFormated}` : "Server hasn't responded yet"}</p>
            <p>{auth?.currentUser?.displayName}</p>
            <p>{auth?.currentUser?.email} </p>
            <button onClick={buttonLogout}>logout</button>
            <Link to="/List">List</Link>
        </div >
    )
}
