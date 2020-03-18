import React from 'react'
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
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
            <TextField readonly
                label={props.title}
                id="outlined-start-adornment"
                className={clsx(classes.margin, classes.textField)}
                value={props.notes}
                variant="outlined" />

        </div>
    )
}

export default NotesLabel;