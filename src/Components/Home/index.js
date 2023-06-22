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
            {/* <img alt="pawel1" src="https://storage.cloud.google.com/ptjournal_pwujczyk-gmail-com/journalId-1494-pageId-825-hiopopotam-022.png"></img><br></br> */}
            <img alt="pawel2" src="https://firebasestorage.googleapis.com/v0/b/ptjournal-b53b0.appspot.com/o/xxx%2Fhiopopotam.png?alt=media"></img><br></br>
            <img alt="pawel3" src="https://firebasestorage.googleapis.com/v0/b/ptjournal-b53b0.appspot.com/o/hiopopotam.png?alt=media"></img><br></br>
            {/* <img alt="pawel4" src="https://firebasestorage.googleapis.com/v0/b/ptjournal-b53b0.appspot.com/o/xxx/hiopopotam.png?alt=media"></img><br></br> */}
            <img alt="pawel5" src="https://firebasestorage.googleapis.com/v0/b/ptjournal-b53b0.appspot.com/o/ocTFwme0AqYwxrJsyyNoHZZOsc83%2FjournalId-1494-pageId-825-Untitled-011.png?alt=media"></img><br></br>
            <img alt="pawel6" src="https://firebasestorage.googleapis.com/v0/b/ptjournal-b53b0.appspot.com/o/user%2FocTFwme0AqYwxrJsyyNoHZZOsc83%2FjournalId-1494-pageId-825-hiopopotam-061.png?alt=media"></img><br></br>
        </div >
    )
}
