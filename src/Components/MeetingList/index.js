import React, { Component } from 'react';
import MeetingItem from 'Components/MeetingItem';
import * as Consts from 'Consts';
import {config} from 'Consts';
import { AuthService } from '../../OAuth/OAuth';
import Tree from 'Components/Tree'



class MeetingList extends Component {

    constructor(props) {
        super(props);
        this.state = {
            meetings: [],
            treeId: -1
        }
        this.setMeetings = this.setMeetings.bind(this);
        this.authService = new AuthService();
        this.TreeId = this.props.match.params.TreeId;
        this.setState({ treeId: this.props.match.params.TreeId });
    }

    callService(){
        console.log("Post");

        this.authService.getUser().then(user => {
            if (user && user.access_token) {

                fetch(`${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETINGS_ACTION}`, {
                    mode: 'cors',
                    crossDomain: true,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${user.access_token}`
                    },
                    body: JSON.stringify({ Id: Number(this.props.match.params.TreeId), DrillDown: false })

                })
                    .then(respone => respone.json())
                    .then(result => this.setMeetings(result))
                    .catch(error => error);
                console.log("Finish post");
            }
        })
    }

    componentDidUpdate(prevProps) {
        let newTreeId = this.props.match.params.TreeId;
        if(newTreeId!==prevProps.match.params.TreeId){
        //if (newTreeId != this.state.treeId) {
            this.callService();
        }
    }

    render() {
        console.log("render");
       
    
        const { meetings } = this.state;
        if (!meetings) { return null }
        return (
            <div>
                <div style={{ width: '400px', float: 'left' }}><Tree></Tree></div>
                <div className="App" style={{ color: 'blue', marginLeft: '400px', width: '1200px' }} >
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
        this.callService();
    }
}

export default MeetingList;