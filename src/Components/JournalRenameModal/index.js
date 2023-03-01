import React, { useState } from 'react'
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import * as apiService from 'services/apiService'

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

export default function JournalRenameModal({ open, selectedJournal, treeItemNewModalCallback, closeModal }) {

    console.log("Modal");
    console.log(selectedJournal);
    const [treeName, setTreeeName] = useState("");

    const renameJournal = function () {
        //apiService.addTreeNode(Number(selectedTreeNode.id), treeName);

        treeItemNewModalCallback();
    }

    const journalNameChange = (e) => {
        setTreeeName(e.target.value);
    }

    const cancel = () => {
        closeModal();
    }



    return (<Modal open={open}>
        <Box sx={style}>
            <p><span>Renaming Journal: </span><b>{selectedJournal?.name}</b></p>
            <TextField id="outlined-basic" label="Outlined" variant="outlined" onChange={journalNameChange} value={selectedJournal?.name || ''} fullWidth={true} /><br />
            <Button variant="contained" color="primary" onClick={renameJournal}>Rename</Button>
            <Button variant="outlined" color="primary" onClick={cancel}>Cancel</Button>
        </Box>
    </ Modal>)
}