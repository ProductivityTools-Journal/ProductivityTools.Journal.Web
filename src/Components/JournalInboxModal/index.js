import React, { useEffect, useState } from 'react';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import * as apiService from 'services/apiService';

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

export default function JournalInboxModal({ open, selectedJournal, closeAndRefresh, closeModal }) {
    const [inboxName, setInboxName] = useState("");

    useEffect(() => {
        setInboxName(selectedJournal?.inboxName || selectedJournal?.InboxName || "");
    }, [selectedJournal]);

    const handleSave = async function () {
        if (!inboxName || !inboxName.trim()) {
            return;
        }
        var r = await apiService.setInboxName(Number(selectedJournal.id), inboxName.trim());
        if (r) {
            closeAndRefresh();
        }
    };

    const inboxNameChange = (e) => {
        setInboxName(e.target.value);
    };

    const cancel = () => {
        closeModal();
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
        }
    };

    return (
        <Modal open={open} onClose={cancel}>
            <Box sx={style}>
                <p><span>Set Inbox Name for: </span><b>{selectedJournal?.name}</b></p>
                <TextField
                    id="inbox-name-input"
                    label="Inbox Name"
                    variant="outlined"
                    onChange={inboxNameChange}
                    value={inboxName || ''}
                    onKeyDown={handleKeyDown}
                    fullWidth={true}
                    autoFocus
                />
                <br />
                <br />
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="contained" color="primary" onClick={handleSave}>
                        Save
                    </Button>
                    <Button variant="outlined" color="primary" onClick={cancel}>
                        Cancel
                    </Button>
                </div>
            </Box>
        </Modal>
    );
}
