import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import SvgIcon from "@mui/material/SvgIcon";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import * as apiService from "services/apiService";
import { useParams } from "react-router-dom";
import "./index.css";
import StyledTreeItem from "./styledTreeItem";
import JournalNewModal from "../JournalNewModal";
import JounralDeleteDialog from "../JounralDeleteDialog";
import JournalRenameModal from "Components/JournalRenameModal";
import JournalInboxModal from "../JournalInboxModal";
import { JournalTreeContext } from "Components/JournalContext/index.js";

function MinusSquare(props) {
  return (
    <SvgIcon fontSize="inherit" style={{ width: 14, height: 14 }} {...props}>
      {/* tslint:disable-next-line: max-line-length */}
      <path d="M22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0zM17.873 11.023h-11.826q-.375 0-.669.281t-.294.682v0q0 .401.294 .682t.669.281h11.826q.375 0 .669-.281t.294-.682v0q0-.401-.294-.682t-.669-.281z" />
    </SvgIcon>
  );
}

function PlusSquare(props) {
  return (
    <SvgIcon fontSize="inherit" style={{ width: 14, height: 14 }} {...props}>
      {/* tslint:disable-next-line: max-line-length */}
      <path d="M22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0zM17.873 12.977h-4.923v4.896q0 .401-.281.682t-.682.281v0q-.375 0-.669-.281t-.294-.682v-4.896h-4.923q-.401 0-.682-.294t-.281-.669v0q0-.401.281-.682t.682-.281h4.923v-4.896q0-.401.294-.682t.669-.281v0q.401 0 .682.281t.281.682v4.896h4.923q.401 0 .682.281t.281.682v0q0 .375-.281.669t-.682.294z" />
    </SvgIcon>
  );
}

function CloseSquare(props) {
  return (
    <SvgIcon className="close" fontSize="inherit" style={{ width: 14, height: 14 }} {...props}>
      {/* tslint:disable-next-line: max-line-length */}
      <path d="M17.485 17.512q-.281.281-.682.281t-.696-.268l-4.12-4.147-4.12 4.147q-.294.268-.696.268t-.682-.281-.281-.682.294-.669l4.12-4.147-4.12-4.147q-.294-.268-.294-.669t.281-.682.682-.281.696 .268l4.12 4.147 4.12-4.147q.294-.268.696-.268t.682.281 .281.669-.294.682l-4.12 4.147 4.12 4.147q.294.268 .294.669t-.281.682zM22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0z" />
    </SvgIcon>
  );
}

export default function CustomizedTreeView({ setSelectedTreeNode, selectedTreeNode }) {
  const [expanded, setExpanded] = useState([]);
  const [root, setRoot] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const params = useParams();

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [inboxModalOpen, setInboxModalOpen] = useState(false);

  const { setJournalTree } = useContext(JournalTreeContext);

  const containerRef = useRef(null);

  const filterTree = (node, term) => {
    if (!node) return null;
    const trimmed = term.trim().toLowerCase();
    if (!trimmed) return node;

    const isMatch = (node.name && node.name.toLowerCase().includes(trimmed)) ||
      (node.inboxName && node.inboxName.toLowerCase().includes(trimmed)) ||
      (node.InboxName && node.InboxName.toLowerCase().includes(trimmed));

    let filteredChildren = [];
    if (node.nodes && Array.isArray(node.nodes)) {
      filteredChildren = node.nodes
        .map((child) => filterTree(child, term))
        .filter(Boolean);
    }

    if (isMatch || filteredChildren.length > 0) {
      return {
        ...node,
        nodes: filteredChildren.length > 0 ? filteredChildren : (isMatch ? (node.nodes || []) : []),
      };
    }
    return null;
  };

  const getAllNodeIds = (node) => {
    if (!node) return [];
    if (Array.isArray(node)) {
      let ids = [];
      for (const n of node) {
        ids = ids.concat(getAllNodeIds(n));
      }
      return ids;
    }
    let ids = [node.id.toString()];
    if (node.nodes && Array.isArray(node.nodes)) {
      for (const child of node.nodes) {
        ids = ids.concat(getAllNodeIds(child));
      }
    }
    return ids;
  };

  const findDeepestNode = (node, depth = 0) => {
    if (!node) return null;
    if (Array.isArray(node)) {
      let deepest = null;
      for (const n of node) {
        const d = findDeepestNode(n, depth);
        if (d && (!deepest || d.depth > deepest.depth)) {
          deepest = d;
        }
      }
      return deepest;
    }

    if (!node.nodes || node.nodes.length === 0) {
      return { node, depth };
    }

    let deepest = null;
    for (const child of node.nodes) {
      const childDeepest = findDeepestNode(child, depth + 1);
      if (childDeepest) {
        if (!deepest || childDeepest.depth > deepest.depth) {
          deepest = childDeepest;
        }
      }
    }

    return deepest || { node, depth };
  };

  const getNodePath = useCallback((node, targetId) => {
    if (targetId == null || !node) return [];
    const targetStr = targetId.toString();
    const path = [];
    const dfs = (curr) => {
      if (!curr) return false;
      path.push(curr.id.toString());
      if (curr.id.toString() === targetStr) return true;
      if (curr.nodes && Array.isArray(curr.nodes)) {
        for (let i = 0; i < curr.nodes.length; i++) {
          if (dfs(curr.nodes[i])) return true;
        }
      }
      path.pop();
      return false;
    };

    const rootList = Array.isArray(node) ? node : [node];
    for (const r of rootList) {
      if (dfs(r)) return path;
    }
    return [];
  }, []);

  const fetchData = useCallback(async () => {
    const r = await apiService.getTree();
    setJournalTree(r);
    if (r != null) {
      setRoot(r);
      const rootNode = Array.isArray(r) ? r[0] : r;
      if (params.TreeId) {
        const path = getNodePath(rootNode, params.TreeId);
        if (path && path.length > 0) {
          setExpanded(path);
        } else if (rootNode?.id != null) {
          setExpanded([rootNode.id.toString()]);
        }
      } else if (rootNode?.id != null) {
        setExpanded((prev) => (prev.length === 0 ? [rootNode.id.toString()] : prev));
      }
    }
  }, [setJournalTree, params.TreeId, getNodePath]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim()) {
      const rootNode = Array.isArray(root) ? root[0] : root;
      const filtered = filterTree(rootNode, value);
      if (filtered) {
        const allFilteredIds = getAllNodeIds(filtered);
        setExpanded(allFilteredIds);
      }
    } else {
      const rootNode = Array.isArray(root) ? root[0] : root;
      if (selectedTreeNode?.id && rootNode) {
        const fullPath = getNodePath(rootNode, selectedTreeNode.id);
        if (fullPath && fullPath.length > 0) {
          setExpanded(fullPath);
        }
      } else if (rootNode?.id != null) {
        setExpanded([rootNode.id.toString()]);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!root) return;
      const rootNode = Array.isArray(root) ? root[0] : root;

      if (searchTerm.trim()) {
        const filtered = filterTree(rootNode, searchTerm);
        if (filtered) {
          const deepestResult = findDeepestNode(filtered);
          if (deepestResult && deepestResult.node) {
            const targetNode = deepestResult.node;
            setSelectedTreeNode(targetNode);

            const fullPath = getNodePath(rootNode, targetNode.id);
            if (fullPath && fullPath.length > 0) {
              setExpanded(fullPath);
            } else {
              setExpanded([targetNode.id.toString()]);
            }
          }
        }
        setSearchTerm("");
      }
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.TreeId]);

  useEffect(() => {
    if (selectedTreeNode?.id && root) {
      const rootNode = Array.isArray(root) ? root[0] : root;
      const fullPath = getNodePath(rootNode, selectedTreeNode.id);
      if (fullPath && fullPath.length > 0) {
        setExpanded((prev) => {
          const combined = new Set([...prev, ...fullPath]);
          return Array.from(combined);
        });
      }
    }
  }, [selectedTreeNode?.id, root, getNodePath]);

  const findElement = (candidateElement, nodeId) => {
    if (!candidateElement) {
      return null;
    }
    if (Array.isArray(candidateElement)) {
      for (let el of candidateElement) {
        let found = findElement(el, nodeId);
        if (found != null) {
          return found;
        }
      }
      return null;
    }
    if (candidateElement.id === nodeId) {
      return candidateElement;
    }
    if (candidateElement.nodes && Array.isArray(candidateElement.nodes)) {
      for (let i = 0; i < candidateElement.nodes.length; i += 1) {
        let newCandidateElement = candidateElement.nodes[i];
        let result = findElement(newCandidateElement, nodeId);
        if (result != null) {
          return result;
        }
      }
    }
    return null;
  };

  function updateElementInroot(elementToUpdate, propertyName, propertyValue) {
    if (!root || !elementToUpdate) return;
    const rootNode = Array.isArray(root) ? root[0] : root;
    let newElement = findElement(rootNode, elementToUpdate.id);
    if (newElement) {
      newElement[propertyName] = propertyValue;
      const updatedRoot = Array.isArray(root) ? [...root] : { ...rootNode };
      setRoot(updatedRoot);
      setJournalTree(updatedRoot);
    }
  }

  const changeParent = useCallback((source, targetParentId) => {
    if (!root || !source || source.id === targetParentId) {
      return;
    }
    const rootNode = Array.isArray(root) ? root[0] : root;
    const childObject = findElement(rootNode, source.id);
    const currentParent = findElement(rootNode, source.parentId);
    if (currentParent && currentParent.nodes) {
      currentParent.nodes = currentParent.nodes.filter((item) => item.id !== source.id);
    }
    const newParentObject = findElement(rootNode, targetParentId);
    if (newParentObject) {
      if (!newParentObject.nodes) {
        newParentObject.nodes = [];
      }
      if (childObject) {
        childObject.parentId = targetParentId;
        newParentObject.nodes.push(childObject);
      }
    }
    const updatedRoot = Array.isArray(root) ? [...root] : { ...rootNode };
    setRoot(updatedRoot);
    setJournalTree(updatedRoot);
    setSelectedTreeNode(source);
  }, [root, setJournalTree, setSelectedTreeNode]);

  const handleToggle = useCallback((event, nodeIds) => {
    setExpanded(nodeIds);
  }, []);

  const openModal = useCallback((type) => {
    switch (type) {
      case "rename":
        setRenameModalOpen(true);
        break;
      case "delete":
        setDeleteModalOpen(true);
        break;
      case "new":
        setNewModalOpen(true);
        break;
      case "inbox":
        setInboxModalOpen(true);
        break;
      default:
        break;
    }
  }, []);

  const closeModal = useCallback(() => {
    setDeleteModalOpen(false);
    setRenameModalOpen(false);
    setNewModalOpen(false);
    setInboxModalOpen(false);
  }, []);

  const closeAndRefresh = useCallback(() => {
    fetchData();
    closeModal();
  }, [fetchData, closeModal]);

  function GetNode(node) {
    if (!node) return null;
    if (Array.isArray(node)) {
      return node.map((x) => GetNode(x));
    }
    return (
      <StyledTreeItem
        key={node.id}
        changeParent={changeParent}
        setSelectedTreeNode={setSelectedTreeNode}
        selectedTreeNode={selectedTreeNode}
        openModal={openModal}
        closeAndRefresh={closeAndRefresh}
        node={node}
      >
        {node?.nodes?.map((x) => GetNode(x))}
      </StyledTreeItem>
    );
  }

  const rootNode = Array.isArray(root) ? root[0] : root;
  const displayedRoot = searchTerm.trim() ? filterTree(rootNode, searchTerm) : root;

  return (
    <div className="conainer" ref={containerRef}>
      <TextField
        size="small"
        fullWidth
        placeholder="Quick search (press Enter to open)..."
        value={searchTerm}
        onChange={handleSearchChange}
        onKeyDown={handleKeyDown}
        variant="outlined"
        style={{ marginBottom: "10px" }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" color="action" />
            </InputAdornment>
          ),
          endAdornment: searchTerm ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => {
                  setSearchTerm("");
                  if (selectedTreeNode?.id && rootNode) {
                    const fullPath = getNodePath(rootNode, selectedTreeNode.id);
                    if (fullPath && fullPath.length > 0) {
                      setExpanded(fullPath);
                    }
                  } else if (rootNode?.id != null) {
                    setExpanded([rootNode.id.toString()]);
                  }
                }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />
      <SimpleTreeView
        expandedItems={expanded}
        onExpandedItemsChange={handleToggle}
        selectedItems={selectedTreeNode?.id ? selectedTreeNode.id.toString() : null}
        defaultCollapseIcon={<MinusSquare />}
        defaultExpandIcon={<PlusSquare />}
        defaultEndIcon={<CloseSquare />}
      >
        {displayedRoot ? (
          GetNode(displayedRoot)
        ) : (
          <div style={{ color: "#888", fontSize: "0.85rem", padding: "8px 4px", fontStyle: "italic" }}>
            No journals found
          </div>
        )}
      </SimpleTreeView>
      {/* <ContextMenu parentRef={containerRef} items={menuItems}></ContextMenu> */}
      <JournalNewModal
        open={newModalOpen}
        selectedTreeNode={selectedTreeNode}
        closeModal={closeModal}
        closeAndRefresh={closeAndRefresh}
      />
      <JournalRenameModal
        open={renameModalOpen}
        selectedJournal={selectedTreeNode}
        closeModal={closeModal}
        closeAndRefresh={closeAndRefresh}
      ></JournalRenameModal>
      <JounralDeleteDialog
        open={deleteModalOpen}
        selectedJournal={selectedTreeNode}
        closeModal={closeModal}
        closeAndRefresh={closeAndRefresh}
      ></JounralDeleteDialog>
      <JournalInboxModal
        open={inboxModalOpen}
        selectedJournal={selectedTreeNode}
        closeModal={closeModal}
        closeAndRefresh={closeAndRefresh}
      ></JournalInboxModal>
    </div>
  );
}
