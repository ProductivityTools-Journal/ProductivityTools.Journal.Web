import React, { useState } from 'react'
import Modal from '@mui/material/Modal';
import * as apiService from 'services/apiService'

export default function TreeItemNewModal(props) {

    const [treeName, setTreeeName] = useState('new');

    const AddNewItem = function () {
        apiService.addTreeNode(Number(props.selectedTreeNode), treeName);
        props.handleModalClose();
    }

    const handleChange = (e) => {
        setTreeeName(e.target.value);
    }

    const body = (
        <div>
            <p>New tree item name:</p>
            <input type='text' value={treeName} onChange={handleChange} />
            <button onClick={() => AddNewItem()}>Add</button>
        </div>
    )
    return <Modal
        {...props} //modal open and close
    ><p>{body}</p></Modal>
}