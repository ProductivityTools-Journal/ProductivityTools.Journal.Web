import React, { useState } from 'react'
import Modal from '@material-ui/core/Modal';
import { makeStyles } from '@material-ui/core/styles'
import * as apiService from 'services/apiService'
import { classExpression } from '@babel/types';

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

    const classes = useStyles();

    const AddNewItem = function () {
        apiService.addTreeNode();
    }

    const body = (
        <div className={classes.paper}>
            <p>New tree item name:</p>
            <input type='text'></input>
            <button onClick={() => AddNewItem()}>Add</button>
        </div>
    )

    return <Modal
        {...props} //modal open and close
    ><p>{body}</p></Modal>
}