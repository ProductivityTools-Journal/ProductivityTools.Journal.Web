import React, { Component } from 'react';
import MeetingItem from 'Components/MeetingItem'
import EditMeeting from 'Components/EditMeeting'


//const PATH_BASE='http://productivitytools.tech:8081/api/	';
const PATH_BASE = 'https://localhost:5001/api/';
const PATH_MEETINGS_CONTROLER = 'Meetings';
const PATH_MEETINGS_ACTION = 'List';

class MeetingList extends Component {

    constructor(props) {
        super(props);
        this.state = {
            meetings: []
        }

        this.setMeetings = this.setMeetings.bind(this);
    }

    render() {
        const { meetings } = this.state;
        //because render is before compnentDidMount
        if (!meetings) { return null }

        return (

            <div className="App">
                {this.state.meetings.map(function (item) {

                    return (
                        <div key={item.meetingId}>
                            <span>CXX</span>
                            <span>{item.meetingId} </span>
                            <span>{item.subject}</span>

                            <MeetingItem meeting={item} />
                        </div>
                    );
                })}

            </div>
        );
    }

    setMeetings(meetings) {
        console.log(meetings)
        this.setState({ meetings });
    }

    componentDidMount() {


        console.log("Post");
        fetch(`${PATH_BASE}${PATH_MEETINGS_CONTROLER}/${PATH_MEETINGS_ACTION}`, {
            mode: 'cors',
            crossDomain: true,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify("SS")

        })
            .then(respone => respone.json())
            .then(result => this.setMeetings(result))
            .catch(error => error);
        console.log("Finish post");
    }
}

export default MeetingList;