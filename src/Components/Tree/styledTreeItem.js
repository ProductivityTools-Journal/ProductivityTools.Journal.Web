import React, { useState, useContext, memo } from 'react';
import { useDrag, useDrop } from 'react-dnd'
import * as apiService from 'services/apiService'
import * as Common from '../Common.js'
import statusService from 'services/statusService'
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import PropTypes from 'prop-types';
import { Menu, MenuItem, Divider, Typography } from '@mui/material';
import { JournalTreeContext } from "Components/JournalContext/index.js";


function TransitionComponent(props) {
    const style = {
        from: { opacity: 0, transform: 'translate3d(20px,0,0)' },
        to: { opacity: props.in ? 1 : 0, transform: `translate3d(${props.in ? 0 : 20}px,0,0)` },
    };

    return (
        <div style={style}>
            <Collapse {...props} />
        </div>
    );
}

TransitionComponent.propTypes = {
    in: PropTypes.bool,
};

function StyledTreeItem(props) {
    const journalTreeContext = useContext(JournalTreeContext);
    const isDebug = journalTreeContext?.debug;

    const { changeParent, node, openModal, closeAndRefresh, selectedTreeNode, setSelectedTreeNode, ...rest } = props;
    const isSelected = selectedTreeNode?.id === node.id;
    const hasInboxName = Boolean(node.inboxName || node.InboxName);
    const currentInboxName = node.inboxName || node.InboxName;

    const treeClick = (e) => {
        e.stopPropagation();
        setSelectedTreeNode(node);
    }

    const changeParent2 = async (source, targetParentId) => {
        if (!source || !targetParentId || source.id === targetParentId) return;
        await apiService.moveTreeNode(source.id, targetParentId);
        changeParent(source, targetParentId);
    }

    function getLabel(x) {
        if (isDebug) {
            return x.name + " [Id:" + x.id + "]";
        }
        return x.name;
    }

    const [{ isDragging }, dragRef] = useDrag({
        type: 'tree',
        item: node,
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        })
    })

    const [{ isOver }, dropRef] = useDrop({
        accept: ['tree', 'page'],
        drop: (item, monitor) => {
            let type = monitor.getItemType();
            if (type === 'tree') {
                changeParent2(item, node.id);
            }
            if (type === 'page') {
                let page = item.page;
                let pageWithNewParent = { ...page, journalId: node.id }
                apiService.updateJournal(pageWithNewParent);
                let removePageFromList = item.removePageFromList;
                removePageFromList(page);
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver()
        })
    })

    const openNewModal = (event) => {
        event.stopPropagation();
        setContextMenu(null);
        props.setSelectedTreeNode(node);
        openModal('new');
    }

    const openRenameModal=(event)=>{
        event.stopPropagation();
        setContextMenu(null);
        props.setSelectedTreeNode(node);
        openModal('rename');
    }

    const openDeleteModal=(event)=>{
        event.stopPropagation();
        setContextMenu(null);
        props.setSelectedTreeNode(node);
        openModal('delete');
    }

    const openSetInboxNameModal = (event) => {
        event.stopPropagation();
        setContextMenu(null);
        props.setSelectedTreeNode(node);
        openModal('inbox');
    }

    const handleClearInboxName = async (event) => {
        event.stopPropagation();
        setContextMenu(null);
        props.setSelectedTreeNode(node);
        const r = await apiService.removeInboxName(node.id);
        if (r && closeAndRefresh) {
            closeAndRefresh();
        }
    }

    const copyPublicLink = async (event) => {
        event.stopPropagation();
        setContextMenu(null);
        const result = await apiService.getJournalPublicHash(node.id);
        if (result) {
            const fullUrl = Common.getJournalPublicUrl(result);
            await Common.copyTextToClipboard(fullUrl);
            statusService.success("Journal public link copied to clipboard!");
        }
    }

    const [contextMenu, setContextMenu] = useState(null);

    const handleContextMenu = (event) => {
        event.preventDefault();
        setContextMenu(contextMenu == null ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6 } : null);
    }

    const handleClose = () => {
        setContextMenu(null);
    }

    return (
        <TreeItem
            ref={dragRef}
            itemId={node.id.toString()}
            nodeId={node.id.toString()}
            {...rest}
            TransitionComponent={TransitionComponent}
            label={
                <Box ref={dropRef} onContextMenu={handleContextMenu}>
                    <Menu
                        open={contextMenu !== null}
                        onClose={handleClose}
                        anchorReference="anchorPosition"
                        anchorPosition={contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
                    >
                        <Box sx={{ px: 2, py: 0.8, borderBottom: '1px solid #e0e0e0', backgroundColor: '#f9f9f9', minWidth: '160px' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: hasInboxName ? '#1976d2' : '#333' }}>
                                {node.name}
                            </Typography>
                            {hasInboxName && (
                                <Typography variant="caption" sx={{ color: '#1976d2', display: 'block', fontWeight: 500 }}>
                                    Inbox: {currentInboxName}
                                </Typography>
                            )}
                        </Box>
                        <MenuItem onClick={openNewModal}>New Journal</MenuItem>
                        <MenuItem onClick={openRenameModal}>Rename</MenuItem>
                        <MenuItem onClick={openDeleteModal}>Remove</MenuItem>
                        {hasInboxName ? (
                            <MenuItem onClick={handleClearInboxName}>Clear inbox name {currentInboxName}</MenuItem>
                        ) : (
                            <MenuItem onClick={openSetInboxNameModal}>Set inbox name</MenuItem>
                        )}
                        <Divider />
                        <MenuItem onClick={copyPublicLink}>Copy Public Link</MenuItem>
                    </Menu>
                    <span
                        onClick={treeClick}
                        style={{
                            cursor: 'pointer',
                            userSelect: 'none',
                            color: isSelected ? '#1565c0' : (hasInboxName ? '#1976d2' : 'inherit'),
                            fontWeight: isSelected ? 600 : (hasInboxName ? 600 : 400),
                            backgroundColor: isSelected ? '#bbdefb' : (hasInboxName ? '#e8f0fe' : 'transparent'),
                            borderRadius: '3px',
                            textDecoration: 'none',
                            display: 'inline-block',
                            padding: '2px 4px'
                        }}
                    >
                        {getLabel(node)}
                    </span>
                    <span>{isDragging && '😱'}</span>
                    <span> {isOver && <span>Drop Here!</span>}</span>
                </Box>
            }
        >
            {props.children}
        </TreeItem>
    );
}

export default memo(StyledTreeItem);
