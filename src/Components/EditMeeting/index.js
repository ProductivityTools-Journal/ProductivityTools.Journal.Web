import React, { Component } from 'react';
import Notes from 'Components/Notes'
import Button from '@material-ui/core/Button'
import * as Consts from 'Consts';

class EditMeeting extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        if (!this.state){return null}
        return (
            <div>
                <p>Title: {this.state.meeting.subject}</p>
                <Notes title='Before notes' notes={this.state.meeting.beforeNotes} />
                <Notes title='During notes' notes={this.state.meeting.duringNotes} />
                <Notes title='After notes' notes={this.state.meeting.afterNotes} />
                <Button variant="contained" color="primary">Save</Button>
            </div>
        )
    }

    setMeeting(meeting){
        console.log(meeting);
        this.setState({meeting})
    }

    componentDidMount() {
        console.log("Fetch one meeting from server");
        fetch(`${Consts.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETING_ACTION}`, {
            mode:'cors',
            crossDomain:true,
            method:'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                Id:2,
                Secret:'xxx'
            })
        })
        .then(respone => respone.json())
        .then(result => this.setMeeting(result))
        .catch(error => error);
    console.log("Finish post");
    }
}

export default EditMeeting;