import React, { useState, useContext, useEffect, useRef } from "react";
import Tree from "Components/Tree";
import PageList from "Components/PageList";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Link, useSearchParams } from "react-router-dom";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import Typography from "@mui/material/Typography";
import * as apiService from "services/apiService";
import * as Common from "../Common.js";
import statusService from "services/statusService";
import { JournalTreeContextProvider, JournalTreeContext } from "../JournalContext";

function findNodeInTree(node, targetId) {
  if (!node || targetId == null) return null;
  const targetNum = Number(targetId);
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findNodeInTree(item, targetNum);
      if (found) return found;
    }
    return null;
  }
  if (Number(node.id) === targetNum) {
    return node;
  }
  if (Array.isArray(node.nodes)) {
    for (const child of node.nodes) {
      const found = findNodeInTree(child, targetNum);
      if (found) return found;
    }
  }
  return null;
}

function MainContent({ debug, setDebug }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [editedMeeting, setEditedMeeting] = useState(undefined);
  const [selectedTreeNode, setSelectedTreeNode] = useState(null);
  const [newPageTrigger, setNewPageTrigger] = useState(null);
  const [highlightedPageId, setHighlightedPageId] = useState(() => {
    const pid = searchParams.get("pageId");
    return pid != null ? Number(pid) : null;
  });
  const [isMigrating, setIsMigrating] = useState(false);
  const [showTree, setShowTree] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth > 768 : true;
  });
  const handledUrlKeyRef = useRef(null);

  const journalTreeContext = useContext(JournalTreeContext);
  const inboxNodes = Common.getInboxNodes(journalTreeContext?.journalTree);

  useEffect(() => {
    const treeIdParam = searchParams.get("treeId");
    const pageIdParam = searchParams.get("pageId");
    const newNoteParam = searchParams.get("newNote");

    if (!treeIdParam || !journalTreeContext?.journalTree) {
      return;
    }

    const urlKey = `${treeIdParam}|${pageIdParam || ""}|${newNoteParam || ""}`;
    if (handledUrlKeyRef.current === urlKey) {
      return;
    }

    const targetNode = findNodeInTree(journalTreeContext.journalTree, treeIdParam);
    if (!targetNode) {
      return;
    }

    handledUrlKeyRef.current = urlKey;
    setSelectedTreeNode(targetNode);
    setHighlightedPageId(pageIdParam != null ? Number(pageIdParam) : null);

    if (newNoteParam === "1") {
      setNewPageTrigger({ treeNodeId: targetNode.id, timestamp: Date.now() });
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("newNote");
      setSearchParams(nextParams, { replace: true });
    }
  }, [journalTreeContext?.journalTree, searchParams, setSearchParams]);

  function newMeeting() {
    setEditedMeeting(null);
  }

  const handleTreeNodeSelect = (node) => {
    setSelectedTreeNode(node);
    setNewPageTrigger(null);
    setHighlightedPageId(null);
    if (searchParams.toString()) {
      handledUrlKeyRef.current = null;
      setSearchParams({}, { replace: true });
    }
  };

  const handleInboxClick = (node) => {
    setSelectedTreeNode(node);
    setHighlightedPageId(null);
    setNewPageTrigger({ treeNodeId: node.id, timestamp: Date.now() });
    if (searchParams.toString()) {
      handledUrlKeyRef.current = null;
      setSearchParams({}, { replace: true });
    }
  };

  const migratePlainText = async () => {
    setIsMigrating(true);
    try {
      const pages = await apiService.getPagesWithoutPlainText();
      if (!pages || pages.length === 0) {
        statusService.info("No pages without PlainText found!");
        setIsMigrating(false);
        return;
      }
      statusService.info(`Found ${pages.length} pages to migrate. Starting conversion...`);
      let successCount = 0;
      for (const page of pages) {
        try {
          let contentObj = null;
          if (page.content) {
            try {
              contentObj = JSON.parse(page.content);
            } catch (e) {
              contentObj = Common.getObjectSlateStructureFromRawDetails(page.subject || "Title", page.content);
            }
          }
          const plainText = Common.getPlainTextFromSlateStructure(contentObj);
          const updatedPage = {
            ...page,
            plainText: plainText,
          };
          await apiService.updateJournal(updatedPage);
          successCount++;
        } catch (err) {
          console.error("Error migrating page", page.pageId, err);
        }
      }
      statusService.success(`Successfully migrated ${successCount}/${pages.length} pages!`);
    } catch (err) {
      console.error("Migration failed", err);
      statusService.error("Migration failed!");
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f6f8", paddingBottom: "40px" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "#ffffff",
          borderBottom: "1px solid #e0e0e0",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <IconButton
            color="primary"
            aria-label="toggle navigation tree"
            onClick={() => setShowTree((prev) => !prev)}
            title={showTree ? "Hide Tree" : "Show Tree"}
            size="small"
          >
            {showTree ? <MenuOpenIcon /> : <MenuIcon />}
          </IconButton>
          <Link
            to="/"
            title="Powrót na stronę główną"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              color: "#1976d2",
              fontWeight: 700,
              fontSize: "1.15rem",
              letterSpacing: "-0.4px",
            }}
          >
            <span
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                backgroundColor: "#1976d2",
                color: "#ffffff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.9rem",
                fontWeight: 700,
              }}
            >
              J
            </span>
            <span>Journal</span>
          </Link>
          {inboxNodes &&
            inboxNodes.map((inboxNode) => (
              <Button
                key={inboxNode.id}
                variant="outlined"
                color="primary"
                size="small"
                onClick={() => handleInboxClick(inboxNode)}
              >
                {inboxNode.inboxName || inboxNode.InboxName}
              </Button>
            ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            onClick={migratePlainText}
            disabled={isMigrating}
          >
            {isMigrating ? "Migrating..." : "Migrate PlainText"}
          </Button>
          {editedMeeting && (
            <Typography variant="body2" sx={{ color: "#666" }}>
              Edited: {editedMeeting}
            </Typography>
          )}
          <FormControlLabel
            control={
              <Checkbox
                checked={debug}
                onChange={(e) => setDebug(e.target.checked)}
                size="small"
                color="primary"
              />
            }
            label={<Typography variant="body2" sx={{ color: "#666" }}>Debug</Typography>}
            style={{ margin: 0, userSelect: "none" }}
          />
        </div>
      </div>
      <DndProvider backend={HTML5Backend}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: "24px",
            padding: "0 24px",
            alignItems: "flex-start",
            maxWidth: "1600px",
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: showTree ? "block" : "none",
              width: "360px",
              minWidth: "280px",
              maxWidth: "100%",
              flexShrink: 0,
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #e0e0e0",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
              padding: "16px",
              boxSizing: "border-box",
            }}
          >
            <Tree
              setSelectedTreeNode={handleTreeNodeSelect}
              selectedTreeNode={selectedTreeNode}
              createNewMeeting={newMeeting}
            />
          </div>
          <div style={{ flex: 1, minWidth: "320px", maxWidth: "100%" }}>
            <PageList
              selectedTreeNode={selectedTreeNode}
              newPageTrigger={newPageTrigger}
              highlightedPageId={highlightedPageId}
            />
          </div>
        </div>
      </DndProvider>
    </div>
  );
}

export default function Main() {
  const [debug, setDebug] = useState(false);

  return (
    <JournalTreeContextProvider debug={debug} setDebug={setDebug}>
      <MainContent debug={debug} setDebug={setDebug} />
    </JournalTreeContextProvider>
  );
}
