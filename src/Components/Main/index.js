import React, { useState } from "react";
import Tree from "Components/Tree";
import PageList from "Components/PageList";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import * as apiService from "services/apiService";
import * as Common from "../Common.js";
import { toast } from "react-toastify";
import { JournalTreeContextProvider } from "../JournalContext";

export default function Main() {
  const [editedMeeting, setEditedMeeting] = useState(undefined);
  const [selectedTreeNode, setSelectedTreeNode] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);

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
      <div>EditedMeeting:{editedMeeting}</div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "5px 0" }}>
        <Link to="/">Home</Link>
        <Button
          variant="contained"
          color="secondary"
          size="small"
          onClick={migratePlainText}
          disabled={isMigrating}
        >
          {isMigrating ? "Migrating..." : "Migrate 100 PlainText"}
        </Button>
      </div>
      <JournalTreeContextProvider>
        <DndProvider backend={HTML5Backend}>
          {" "}
          {/* drag and drop */}
          <div style={{ width: "400px", float: "left" }}>
            <Tree
              setSelectedTreeNode={setSelectedTreeNode}
              selectedTreeNode={selectedTreeNode}
              createNewMeeting={newMeeting}
            />
          </div>
          <PageList selectedTreeNode={selectedTreeNode} />
        </DndProvider>
      </JournalTreeContextProvider>{" "}
    </div>
  );
}
