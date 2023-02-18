import React, { useEffect, useState } from 'react';
import JournalItem from 'Components/JournalItem';
import * as apiService from 'services/apiService'
import Button from '@mui/material/Button';
import { v4 as uuid } from 'uuid';
import { useAuth } from '../../Session/AuthContext'


export default function MeetingList(props) {

    const [meetings, setMeetings] = useState([]);


    useEffect(() => {
        const fetchData = async () => {
            const data = await apiService.fetchMeetingList(props.selectedTreeNode);
            data.forEach(element => {
                element.frontendId = uuid()
            });
            setMeetings(data);
        }
        fetchData();
        console.log("fetching data");
    }, [props.selectedTreeNode]);

    const updateMeetingInList = (meeting) => {

        console.log(meeting);
        console.log("updateMeetingInList");
        console.log(meetings);
        let updatedList = meetings.map(item => {
            if (item.frontendId === meeting.frontendId) {
                if (meeting.Deleted == true) {
                    //do nothing

                }
                else {
                    let r = { ...item, ...meeting }
                    return r;
                }
            }
            else {
                return item;
            }
        }).filter(item => item != undefined);
        debugger;
        setMeetings(updatedList);
    }

    const newEvent = () => {
        console.log('new event');
        let newPage = [{ frontendId: uuid(), mode: 'edit', subject: 'InitialMeetingName', treeId: props.selectedTreeNode, notesList: [{ type: 'new', notes: 'Add notes here', guid: uuid() }] }]
        setMeetings([...newPage, ...meetings]);
    }

    const checkState = () => {
        console.log(meetings);
    }
    return (
        <div className="App" style={{ color: 'blue', marginLeft: '400px', width: '1200px' }} >
            <Button onClick={newEvent} >Add New</Button>
            <Button onClick={checkState} >CheckSatate</Button>
            <p>Pages:</p>
            {meetings && meetings.length > 0 && meetings.map(function (item) {
                debugger;
                return (
                    <JournalItem meeting={item} updateMeetingInList={updateMeetingInList} key={item.journalItemId} />
                );
            })}

        </div>
    );
}
