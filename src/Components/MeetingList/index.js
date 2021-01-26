import React, { Component } from 'react';
import MeetingItem from 'Components/MeetingItem';
import * as Consts from 'Consts';
import { AuthService } from '../../OAuth/OAuth';
import Tree from 'Components/Tree'



class MeetingList extends Component {

    constructor(props) {
        super(props);
        this.state = {
            meetings: []
        }
        this.setMeetings = this.setMeetings.bind(this);
        this.authService = new AuthService();
    }

    render() {
        const { meetings } = this.state;
        //because render is before compnentDidMount
        if (!meetings) { return null }

        return (
            <div>
                <div style={{ width: '300px', float: 'left' }}><Tree></Tree></div>
                <div className="App" style={{ color: 'blue', marginLeft: '300px', width: '1200px' }} >
                    {this.state.meetings.map(function (item) {
                        return (
                            <MeetingItem meeting={item} key={item.meetingId} />
                        );
                    })}

                </div>
            </div>
        );
    }

    setMeetings(meetings) {
        console.log(meetings)
        this.setState({ meetings });
    }

    componentDidMount() {
        console.log("Post");
        this.authService.getUser().then(user => {
            if (user && user.access_token) {

                fetch(`${Consts.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETINGS_ACTION}`, {
                    mode: 'cors',
                    crossDomain: true,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${user.access_token}`
                    },
                    body: JSON.stringify({ Id: null, DrillDown: true })

                })
                    .then(respone => respone.json())
                    .then(result => this.setMeetings(result))
                    .catch(error => error);
                console.log("Finish post");
            }
        })
    }
}

export default MeetingList;