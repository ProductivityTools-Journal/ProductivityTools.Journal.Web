import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MeetingItem from 'Components/MeetingItem';
//import { AuthService } from '../../OAuth/OAuth';
import Tree from 'Components/Tree'
import * as apiService from 'services/apiService'



export default function MeetingList(props) {

    const [meetings, setMeetings] = useState([]);
    const params = useParams();
    useEffect(() => {
        const fetchData = async () => {
            const data = await apiService.fetchMeetingList(props.selectedTreeNode);
            setMeetings(data);
        }
        fetchData();
        console.log("fetching data");
    }, [props.selectedTreeNode]);


    return (
        <div className="App" style={{ color: 'blue', marginLeft: '400px', width: '1200px' }} >
            {meetings && meetings.length > 0 && meetings.map(function (item) {
                return (
                    <MeetingItem meeting={item} onMeetingEdit={props.onMeetingEdit} key={item.meetingId} />
                );
            })}

        </div>
    );
}
