import React, {Component} from 'react'
import NotesLabel from 'Components/NotesLabel'

class AutoHideNotes extends Component{

    constructor(props){
        super(props)
        this.state={
            ...props
        }
    }

    render(){
        return (this.state.notes!=null && <NotesLabel title={this.state.title} notes={this.state.notes} />)
    }
}
export default AutoHideNotes