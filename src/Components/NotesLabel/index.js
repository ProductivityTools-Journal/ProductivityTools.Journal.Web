import React from 'react'
import TextField from '@mui/material/TextField';
import clsx from 'clsx';
import SlateEditor from 'Components/SlateEditor';


function NotesLabel({ pageObjectContent, pageObjectContentChanged, readOnly }) {




    return (
        <div>
            {/* <p>page2</p>
            <p>{pageObjectContent && pageObjectContent.length>0 && pageObjectContent[0].children[0].text}</p> */}
            {/* <SlateEditor selectedElement={props.selectedElement} detailsChanged={detailsChanged} titleChanged={updateTitle}></SlateEditor> */}
            <SlateEditor pageObjectContent={pageObjectContent} readOnly={readOnly} pageObjectContentChanged={pageObjectContentChanged}></SlateEditor>

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