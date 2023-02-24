import React from 'react'
import TextField from '@mui/material/TextField';
import clsx from 'clsx';
import SlateEditor from 'Components/SlateEditor';


function NotesLabel({pageJsonContent,readOnly}) {
    return (
        <div>
            {/* <p>page2</p>
            <p>{pageJsonContent && pageJsonContent.length>0 && pageJsonContent[0].children[0].text}</p> */}
            {/* <SlateEditor selectedElement={props.selectedElement} detailsChanged={detailsChanged} titleChanged={updateTitle}></SlateEditor> */}
            <SlateEditor pageJsonContent={pageJsonContent} readOnly={readOnly}></SlateEditor>

            {/* <TextField
                label={props.title}
                value={props.notes}
                multiline
                fullWidth
                variant="outlined"
                readOnly

                id="outlined-start-adornment"
            /> */}
        </div>
    )
}

export default NotesLabel;