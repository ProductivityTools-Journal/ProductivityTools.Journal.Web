import React, { useState } from 'react';
import Tree from 'Components/Tree'
import JournalList from 'Components/JournalList'
import JournalItemEdit from 'Components/JournalItemEdit'
import JournalItemNew from 'Components/JournalItemNew';
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'



export default function Main() {

    const [editedMeeting, setEditedMeeting] = useState(undefined);
    const [selectedTreeNode, setSelectedTreeNode] = useState(1);

    function setEditMeeting(journalItemId) {
        setEditedMeeting(journalItemId)
    }

    function newMeeting() {
        setEditedMeeting(null)
    }

    function clearEditMeeting() {
        setEditedMeeting(undefined);
    }

    // function getContentComponent() {
    //     if (editedMeeting) {
    //         return <JournalItemEdit journalItemId={editedMeeting} clearEditMeeting={clearEditMeeting} />
    //     }
    //     else if (editedMeeting === null) {
    //         return <JournalItemNew TreeId={selectedTreeNode} clearEditMeeting={clearEditMeeting} />
    //     }
    //     else {
    //         return <JournalList selectedTreeNode={selectedTreeNode} onMeetingEdit={setEditMeeting} />
    //     }
    // }

    return (
        <div>
            <div>EditedMeeting:{editedMeeting}</div>
            <div style={{ width: '400px', float: 'left' }}>
                <DndProvider backend={HTML5Backend}> {/* drag and drop */}
                    <Tree setSelectedTreeNode={setSelectedTreeNode} selectedTreeNode={selectedTreeNode} createNewMeeting={newMeeting} />
                </DndProvider>

            </div>
            <JournalList selectedTreeNode={selectedTreeNode}  />
        </div>
    );
}
