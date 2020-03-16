import React, {Component} from 'react'
import Notes from 'Components/Notes'

class AutoHideNotes extends Component{

    constructor(props){
        super(props)
        this.state={
            ...props
        }
    }

    render(){
        return (this.state.notes!=null && <Notes title={this.state.title} notes={this.state.notes} />)
    }
}
export default AutoHideNotes