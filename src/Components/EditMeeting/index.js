import React, { Component } from 'react';
import Notes from 'Components/Notes'
import Button from '@material-ui/core/Button'
import * as Consts from 'Consts';

class EditMeeting extends Component {

    constructor(props) {
        super(props);

        this.save=this.save.bind(this);
        this.updateState=this.updateState.bind(this);
    }

    render() {
        if (!this.state) { return null }
        return (
            <div>
                <p>Title: {this.state.meeting.subject}</p>
                <Notes title='Before notes' name='beforeNotes' notes={this.state.meeting.beforeNotes} updateState={this.updateState} />
                <Notes title='During notes'  name='duringNotes' notes={this.state.meeting.duringNotes} updateState={this.updateState}/>
                <Notes title='After notes'  name='afterNotes' notes={this.state.meeting.afterNotes} updateState={this.updateState}/>
                <Button variant="contained" color="primary" onClick={()=>this.save()}>Save</Button>
            </div>
        )
    }

    setMeeting(meeting) {
        console.log(meeting);
        this.setState({ meeting })
    }

    componentDidMount() {
        console.log("Fetch one meeting from server");
        fetch(`${Consts.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETING_ACTION}`, {
            mode: 'cors',
            crossDomain: true,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                Id: 2,
                Secret: 'xxx'
            })
        })
            .then(respone => respone.json())
            .then(result => this.setMeeting(result))
            .catch(error => error);
        console.log("Finish post");
    }

    updateState(event){
       
        const value=event.target.value;
        const name=event.target.name

        const x={...this.state.meeting,[name]:value}
        this.setState({...this.state,meeting:x})
        debugger;
    }

    save() {
        debugger;
        alert("fdsa");
    }
}

export default EditMeeting;