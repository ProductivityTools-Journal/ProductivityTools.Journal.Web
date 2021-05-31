import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MeetingItem from 'Components/MeetingItem';
//import { AuthService } from '../../OAuth/OAuth';
import Tree from 'Components/Tree'
import MeetingList from 'Components/MeetingList'
import EditMeeting from 'Components/EditMeeting'
import * as apiService from 'services/apiService'




export default function Main() {

    const [meetings, setMeetings] = useState([]);
    const [editedMeeting, setEditedMeeting] = useState();
    //const [treeId, setTreeId] = React.useState(-1);
    const params = useParams();
    //let authService = new AuthService();
    useEffect(() => {
        const fetchData = async () => {
            console.log("parameter")
            console.log(params.TreeId);
            const data = await apiService.fetchMeetingList(params.TreeId);
            console.log("data returned from async method")
            console.log(data);
            setMeetings(data);
        }
        fetchData();
    }, [params.TreeId]);

    function SetEditMeeting(meetingId) {
        setEditedMeeting(meetingId)
    }

    function ClearEditMeeting() {
        setEditedMeeting(undefined);
    }

    console.log("meetings before render");
    console.log(meetings);
    return (
        <div>
            <div>EditedMeeting:{editedMeeting}</div>
            <div style={{ width: '400px', float: 'left' }}><Tree></Tree></div>
            {editedMeeting ? <EditMeeting meetingId={editedMeeting} clearEditMeeting={ClearEditMeeting}></EditMeeting> : <MeetingList onMeetingEdit={SetEditMeeting}></MeetingList>}
        </div>
    );
    //  }


}
