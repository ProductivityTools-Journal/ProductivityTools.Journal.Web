import React, { Component } from 'react';
import MeetingItem from 'Components/MeetingItem';
import * as Consts from 'Consts';



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
                        <MeetingItem meeting={item} />
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
        fetch(`${Consts.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETINGS_ACTION}`, {
            mode: 'cors',
            crossDomain: true,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify("xxx")

        })
            .then(respone => respone.json())
            .then(result => this.setMeetings(result))
            .catch(error => error);
        console.log("Finish post");
    }
}

export default MeetingList;