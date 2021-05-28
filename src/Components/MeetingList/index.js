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

    // constructor(props) {
    //     super(props);
    //     this.state = {
    //         meetings: [],
    //         treeId: -1
    //     }
    //     this.setMeetings = this.setMeetings.bind(this);
    //     this.authService = new AuthService();
    //     this.TreeId = this.props.match.params.TreeId;
    //     this.setState({ treeId: this.props.match.params.TreeId });
    // }

    // setMeetings(meetings) {
    //     console.log(meetings)
    //     this.setState({ meetings });
    // }

    // componentDidMount() {
    //     this.callService();
    // }

    // async function callService() {
    //     console.log("Post");
    //     var data = await apiService.fetchMeetingList(params.TreeId);
    //     setMeetings(data);
    //     // authService.getUser().then(async user =>  {
    //     //     if (user && user.access_token) {
    //     //         var data=await apiService.fetchMeetingList(params.TreeId);
    //     //         setMeetings(data);
    //     //         // fetch(`${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETINGS_ACTION}`, {
    //     //         //     mode: 'cors',
    //     //         //     crossDomain: true,
    //     //         //     method: 'POST',
    //     //         //     headers: {
    //     //         //         'Content-Type': 'application/json',
    //     //         //         Authorization: `Bearer ${user.access_token}`
    //     //         //     },
    //     //         //     body: JSON.stringify({ Id: Number(params.TreeId), DrillDown: false })

    //     //         // })
    //     //         //     .then(respone => respone.json())
    //     //         //     .then(result => this.setMeetings(result))
    //     //         //     .catch(error => error);
    //     //         // console.log("Finish post");
    //     //     }
    //     // })
    // }

    // componentDidUpdate(prevProps) {
    //     let newTreeId = this.props.match.params.TreeId;
    //     if(newTreeId!==prevProps.match.params.TreeId){
    //     //if (newTreeId != this.state.treeId) {
    //         this.callService();
    //     }
    // }

    // render() {
    //     console.log("render");


    //     const { meetings } = this.state;
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
