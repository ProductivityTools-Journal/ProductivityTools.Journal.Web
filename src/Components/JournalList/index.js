import React, { useEffect, useState } from 'react';
import JournalItem from 'Components/JournalItem';
import * as apiService from 'services/apiService'
import Button from '@material-ui/core/Button';




export default function MeetingList(props) {

    const [meetings, setMeetings] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const data = await apiService.fetchMeetingList(props.selectedTreeNode);
            setMeetings(data);
        }
        fetchData();
        console.log("fetching data");
    }, [props.selectedTreeNode]);

    const updateMeetingInList = (meeting) => {
        console.log(meeting);
        console.log("updateMeetingInList");
        console.log(meetings);
        debugger;
        let xx = meetings.find(x => x.journalItemId === meeting.journalItemId);
        xx.subject = meeting.subject;
        xx.notesList = meeting.notesList;
        setMeetings(meetings);
    }

    const newEvent = () => {

        console.log('new event');
        debugger;
        let newPage = [{ subject: 'InitialMeetingName',  notesList: [{ type: 'new', notes: 'Add notes here' }] }]
        setMeetings([...newPage, ...meetings]);
    }

    return (
        <div className="App" style={{ color: 'blue', marginLeft: '400px', width: '1200px' }} >
            <Button onClick={newEvent} >Add New</Button>
            {meetings && meetings.length > 0 && meetings.map(function (item) {
                return (
                    <JournalItem meeting={item} updateMeetingInList={updateMeetingInList} key={item.journalItemId} />
                );
            })}

        </div>
    );
}
