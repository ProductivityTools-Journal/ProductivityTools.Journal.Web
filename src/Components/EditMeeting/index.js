import React, { Component } from 'react';
import Notes from 'Components/Notes'

class EditMeeting extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <Notes title='Before notes' notes='fdsa' />
                <Notes title='During notes' notes='fdsa'  />
                <Notes title='After notes' notes='fdsa'  />
            </div>
        )
    }
}

export default EditMeeting;