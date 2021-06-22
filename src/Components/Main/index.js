import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MeetingItem from 'Components/MeetingItem';
import Tree from 'Components/Tree'
import MeetingList from 'Components/MeetingList'
import EditMeeting from 'Components/EditMeeting'
import * as apiService from 'services/apiService'
import NewJournalItem from 'Components/NewJournalItem';

export default function Main() {

    const [editedMeeting, setEditedMeeting] = useState(undefined);
    const [selectedTreeNode,setSelectedTreeNode]=useState(1);

    function setEditMeeting(meetingId) {
        setEditedMeeting(meetingId)
    }

    function newMeeting() {
        setEditedMeeting(null)
    }

    function clearEditMeeting() {
        setEditedMeeting(undefined);
    }

    function getContentComponent() {
        if (editedMeeting) {
            return <EditMeeting meetingId={editedMeeting} clearEditMeeting={clearEditMeeting}></EditMeeting>
        }
        else if (editedMeeting === null) {
            return <NewJournalItem TreeId={selectedTreeNode} clearEditMeeting={clearEditMeeting}></NewJournalItem>
        }
        else {
            return <MeetingList selectedTreeNode={selectedTreeNode} onMeetingEdit={setEditMeeting}></MeetingList>
        }
    }

    return (
        <div>
            <button onClick={newMeeting}>dddd</button>
            <div>EditedMeeting:{editedMeeting}</div>
            <div style={{ width: '400px', float: 'left' }}><Tree setSelectedTreeNode={setSelectedTreeNode} createNewMeeting={newMeeting}></Tree></div>
            {getContentComponent()}
        </div>
    );
}
