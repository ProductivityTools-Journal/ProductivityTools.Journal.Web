import React from 'react'
import TextField from '@mui/material/TextField';
import clsx from 'clsx';


function NotesLabel(props) {
    return (
        <div>
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