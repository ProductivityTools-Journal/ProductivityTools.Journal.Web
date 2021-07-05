import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import JournalItem from 'Components/JournalItem';
import Tree from 'Components/Tree'
import JournalList from 'Components/JournalList'
import JournalItemEdit from 'Components/JournalItemEdit'
import * as apiService from 'services/apiService'
import JournalItemNew from 'Components/JournalItemNew';

export default function Main() {

    const [editedMeeting, setEditedMeeting] = useState(undefined);
    const [selectedTreeNode, setSelectedTreeNode] = useState(1);

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
            return <JournalItemEdit meetingId={editedMeeting} clearEditMeeting={clearEditMeeting} />
        }
        else if (editedMeeting === null) {
            return <JournalItemNew TreeId={selectedTreeNode} clearEditMeeting={clearEditMeeting} />
        }
        else {
            return <JournalList selectedTreeNode={selectedTreeNode} onMeetingEdit={setEditMeeting} />
        }
    }

    return (
        <div>
            <div>EditedMeeting:{editedMeeting}</div>
            <div style={{ width: '400px', float: 'left' }}>
                <Tree setSelectedTreeNode={setSelectedTreeNode} selectedTreeNode={selectedTreeNode} createNewMeeting={newMeeting} />
            </div>
            {getContentComponent()}
        </div>
    );
}
