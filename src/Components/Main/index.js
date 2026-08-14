import React, { useState } from "react";
import Tree from "Components/Tree";
import PageList from "Components/PageList";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import * as apiService from "services/apiService";
import * as Common from "../Common.js";
import { toast } from "react-toastify";
import { JournalTreeContextProvider } from "../JournalContext";

export default function Main() {
  const [editedMeeting, setEditedMeeting] = useState(undefined);
  const [selectedTreeNode, setSelectedTreeNode] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [debug, setDebug] = useState(false);
  const [showTree, setShowTree] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth > 768 : true;
  });

  function setEditMeeting(journalItemId) {
    setEditedMeeting(journalItemId);
  }

  function newMeeting() {
    setEditedMeeting(null);
  }

  function clearEditMeeting() {
    setEditedMeeting(undefined);
  }

  const migratePlainText = async () => {
    setIsMigrating(true);
    try {
      const pages = await apiService.getPagesWithoutPlainText();
      if (!pages || pages.length === 0) {
        toast.info("No pages without PlainText found!");
        setIsMigrating(false);
        return;
      }
      toast.info(`Found ${pages.length} pages to migrate. Starting conversion...`);
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
      toast.success(`Successfully migrated ${successCount}/${pages.length} pages!`);
    } catch (err) {
      console.error("Migration failed", err);
      toast.error("Migration failed!");
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 12px",
          borderBottom: "1px solid #e0e0e0",
          marginBottom: "12px",
          flexWrap: "wrap",
        }}
      >
        <IconButton
          color="primary"
          aria-label="toggle navigation tree"
          onClick={() => setShowTree((prev) => !prev)}
          title={showTree ? "Hide Tree" : "Show Tree"}
        >
          {showTree ? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>
        <Link to="/" style={{ textDecoration: "none", color: "#1976d2", fontWeight: 500 }}>
          Home
        </Link>
        <Button
          variant="contained"
          color="secondary"
          size="small"
          onClick={migratePlainText}
          disabled={isMigrating}
        >
          {isMigrating ? "Migrating..." : "Migrate 1000 PlainText"}
        </Button>
        {editedMeeting && (
          <div style={{ fontSize: "0.85rem", color: "#666" }}>EditedMeeting: {editedMeeting}</div>
        )}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={debug}
                onChange={(e) => setDebug(e.target.checked)}
                size="small"
                color="primary"
              />
            }
            label="Debug"
            style={{ margin: 0, userSelect: "none" }}
          />
        </div>
      </div>
      <JournalTreeContextProvider debug={debug} setDebug={setDebug}>
        <DndProvider backend={HTML5Backend}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              gap: "20px",
              padding: "0 12px",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                display: showTree ? "block" : "none",
                width: "350px",
                minWidth: "280px",
                maxWidth: "100%",
                flexShrink: 0,
                borderRight: "1px solid #e0e0e0",
                paddingRight: "12px",
                boxSizing: "border-box",
              }}
            >
              <Tree
                setSelectedTreeNode={setSelectedTreeNode}
                selectedTreeNode={selectedTreeNode}
                createNewMeeting={newMeeting}
              />
            </div>
            <div style={{ flex: 1, minWidth: "300px", maxWidth: "100%" }}>
              <PageList selectedTreeNode={selectedTreeNode} />
            </div>
          </div>
        </DndProvider>
      </JournalTreeContextProvider>
    </div>
  );
}
