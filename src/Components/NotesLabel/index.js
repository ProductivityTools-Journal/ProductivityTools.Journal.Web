import React from 'react'
import { makeStyles } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import clsx from 'clsx';

const useStyles = makeStyles(theme => ({
    margin: {
        margin: theme.spacing(1),
    },
}));

function NotesLabel(props) {
    const classes = useStyles();
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
                className={clsx(classes.margin, classes.textField)}
                />
        </div>
    )
}

export default NotesLabel;