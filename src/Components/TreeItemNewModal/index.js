import React, { useState } from 'react'
import Modal from '@mui/material/Modal';
import * as apiService from 'services/apiService'

export default function TreeItemNewModal({ open, selectedTreeNode, handleModalClose }) {

    const [treeName, setTreeeName] = useState('new');

    const AddNewItem = function () {
        apiService.addTreeNode(Number(selectedTreeNode), treeName);
        handleModalClose();
    }

    const handleChange = (e) => {
        setTreeeName(e.target.value);
    }

    const cancel = () => {
        handleModalClose();
    }

    const body = (
        <div>
            <p>New tree item name:</p>
            <input type='text' value={treeName} onChange={handleChange} />
            <button onClick={() => AddNewItem()}>Add</button>
            <button onClick={cancel}>Cancel</button>
        </div>
    )
    return <Modal open={open}><p>{body}</p></ Modal>
}