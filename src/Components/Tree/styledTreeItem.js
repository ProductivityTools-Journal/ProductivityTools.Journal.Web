import { useEffect, useState, } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import * as apiService from 'services/apiService'
import TreeItem from '@mui/lab/TreeItem';
import Box from '@mui/material/Box';
import { Link, useParams } from "react-router-dom";
import Collapse from '@mui/material/Collapse';
import PropTypes from 'prop-types';
import { Menu, MenuItem } from '@mui/material';
import { popoverClasses } from "@mui/material/Popover";


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
    /**
     * Show the component; triggers the enter or exit states
     */
    in: PropTypes.bool,
};

export default function StyledTreeItem(props) {
    //console.log("StyledTreeItem")
   // console.log(props);
    const { changeParent, node, openModal, ...rest } = props;
    const treeClick = (e, node) => {
        e.stopPropagation();
        props.setSelectedTreeNode(node);
    }


    const changeParent2 = (source, targetParentId) => {
       // debugger;
        apiService.moveTreeNode(source.id, targetParentId)
        changeParent(source, targetParentId);
    }

    function getLabel(x) {
        let l = x.name + " [Id:" + x.id + "]";
        return l;
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
            console.log(item);
            console.log(monitor.getItemType())
            let type = monitor.getItemType();
            if (type == 'tree') {
                changeParent2(item, node.id);
            }
            if (type == 'page') {
                debugger;
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

    const [contextMenu, setContextMenu] = useState(null);


    const handleContextMenu = (event) => {
        setContextMenu(null);
        console.log("handleContextMenu");
        console.log(event);
        event.preventDefault();
        setContextMenu(contextMenu == null ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6 } : null)

    }

    const handleClose = () => {
        console.log(props);
        setContextMenu(null);
    }

    return (<TreeItem ref={dragRef} nodeId={node.id} {...rest} TransitionComponent={TransitionComponent} label={
        <Box ref={dropRef} onContextMenu={handleContextMenu} >
            <Menu open={contextMenu !== null}
                onClose={handleClose}
                anchorReference="anchorPosition"
                anchorPosition={contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
            >
                <MenuItem onClick={openNewModal}>New Journal under &nbsp;<b>{node.name}</b></MenuItem>
                <MenuItem onClick={openRenameModal}>Rename &nbsp;<b>{node.name}</b></MenuItem>
                <MenuItem onClick={openDeleteModal}>Remove &nbsp;<b>{node.name}</b></MenuItem>

            </Menu>
            <Link to="#" onClick={(e) => treeClick(e, node)}>{getLabel(node)}</Link>
            <span>{isDragging && '😱'}</span>
            <span> {isOver && <span>Drop Here!</span>}</span>

        </Box>}>

    </TreeItem>)
}
