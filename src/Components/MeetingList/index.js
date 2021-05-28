import React, { useEffect,useState } from 'react';
import { useParams } from 'react-router-dom';
import MeetingItem from 'Components/MeetingItem';
//import { AuthService } from '../../OAuth/OAuth';
import Tree from 'Components/Tree'
import * as apiService from 'services/apiService'



export default function MeetingList() {

    const [meetings, setMeetings] = useState([]);
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


    console.log("meetings before render");
    console.log(meetings);
        return (
            <div>
                <div style={{ width: '400px', float: 'left' }}><Tree></Tree></div>
                <div className="App" style={{ color: 'blue', marginLeft: '400px', width: '1200px' }} >
                    {meetings && meetings.length>0 && meetings.map(function (item) {
                        return (
                            <MeetingItem meeting={item} key={item.meetingId} />
                        );
                    })}

                </div>
            </div>
        );
    //  }


}
