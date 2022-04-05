import React from 'react'
import TextField from '@mui/material/TextField';
import clsx from 'clsx';
import SlateEditor from 'Components/SlateEditor';


function NotesLabel(props) {
    return (
        <div>
            {/* <SlateEditor selectedElement={props.selectedElement} detailsChanged={detailsChanged} titleChanged={updateTitle}></SlateEditor> */}
            <SlateEditor selectedElement={props.selectedElement} readOnly={props.readOnly}></SlateEditor>

            <TextField
                label={props.title}
                value={props.notes}
                multiline
                fullWidth
                variant="outlined"
                readOnly

                id="outlined-start-adornment"
            />
        </div>
    )
}

export default NotesLabel;