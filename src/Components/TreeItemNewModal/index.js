import React, { useState } from 'react'
import Modal from '@material-ui/core/Modal';
import { makeStyles } from '@material-ui/core/styles'
import * as apiService from 'services/apiService'

const useStyles = makeStyles((theme) => ({
    paper: {
        position: 'absolute',
        width: 400,
        backgroundColor: theme.palette.background.paper,
        border: '2px solid #000',
        boxShadow: theme.shadows[5],
        padding: theme.spacing(2, 4, 3),
        top: `50%`,
        left: `50%`,
        transform: `translate(-50%,-50%)`
    },
}));

export default function TreeItemNewModal(props) {

    const [treeName, setTreeeName] = useState('new');

    const classes = useStyles();

    const AddNewItem = function () {
        apiService.addTreeNode(Number(props.selectedTreeNode), treeName);
        props.handleModalClose();
    }

    const handleChange = (e) => {
        setTreeeName(e.target.value);
    }

    const body = (
        <div className={classes.paper}>
            <p>New tree item name:</p>
            <input type='text' value={treeName} onChange={handleChange} />
            <button onClick={() => AddNewItem()}>Add</button>
        </div>
    )
    return <Modal
        {...props} //modal open and close
    ><p>{body}</p></Modal>
}