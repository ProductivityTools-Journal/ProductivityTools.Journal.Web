import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MeetingItem from 'Components/MeetingItem';
//import { AuthService } from '../../OAuth/OAuth';
import Tree from 'Components/Tree'
import MeetingList from 'Components/MeetingList'
import EditMeeting from 'Components/EditMeeting'
import * as apiService from 'services/apiService'

export default function Main() {

    const [editedMeeting, setEditedMeeting] = useState();

    function SetEditMeeting(meetingId) {
        setEditedMeeting(meetingId)
    }

    function ClearEditMeeting() {
        setEditedMeeting(undefined);
    }

    return (
        <div>
            <div>EditedMeeting:{editedMeeting}</div>
            <div style={{ width: '400px', float: 'left' }}><Tree></Tree></div>
            {editedMeeting ? <EditMeeting meetingId={editedMeeting} clearEditMeeting={ClearEditMeeting}></EditMeeting> : <MeetingList onMeetingEdit={SetEditMeeting}></MeetingList>}
        </div>
    );
}
