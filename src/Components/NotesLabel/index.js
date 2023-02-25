import React from 'react'
import TextField from '@mui/material/TextField';
import clsx from 'clsx';
import SlateEditor from 'Components/SlateEditor';


function NotesLabel({ pageContentObject, pageContentObjectChanged, readOnly }) {




    return (
        <div>
            {/* <p>page2</p>
            <p>{pageContentObject && pageContentObject.length>0 && pageContentObject[0].children[0].text}</p> */}
            {/* <SlateEditor selectedElement={props.selectedElement} detailsChanged={detailsChanged} titleChanged={updateTitle}></SlateEditor> */}
            <SlateEditor pageContentObject={pageContentObject} readOnly={readOnly} pageContentObjectChanged={pageContentObjectChanged}></SlateEditor>

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