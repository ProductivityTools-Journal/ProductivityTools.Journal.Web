import React, { useEffect, useState } from 'react';
import JournalItem from 'Components/JournalItem';
import * as apiService from 'services/apiService'



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
        setMeetings(meetings);
    }

    return (
        <div className="App" style={{ color: 'blue', marginLeft: '400px', width: '1200px' }} >
            {meetings && meetings.length > 0 && meetings.map(function (item) {
                return (
                    <JournalItem meeting={item} updateMeetingInList={updateMeetingInList} key={item.journalItemId} />
                );
            })}

        </div>
    );
}
