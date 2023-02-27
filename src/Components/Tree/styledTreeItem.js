import { useDrag, useDrop } from 'react-dnd'
import * as apiService from 'services/apiService'
import TreeItem from '@mui/lab/TreeItem';
import Box from '@mui/material/Box';
import { Link, useParams } from "react-router-dom";
import Collapse from '@mui/material/Collapse';
import PropTypes from 'prop-types';

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

export default function StyledTreeItem (props)  {

    const { changeParent, node, ...rest } = props;
    const treeClick = (e, treeId) => {
      e.stopPropagation();
      props.setSelectedTreeNode(treeId);
    }
  
    const changeParent2 = (source, targetParentId) => {
      debugger;
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
  
    return (<TreeItem ref={dragRef} {...rest} TransitionComponent={TransitionComponent} label={
      <Box ref={dropRef}>
        <Link to="#" onClick={(e) => treeClick(e, node.id)}>{getLabel(node)}</Link>
        <span>{isDragging && '😱'}</span>
        <span> {isOver && <span>Drop Here!</span>}</span>
  
      </Box>}>
  
    </TreeItem>)
  }
  