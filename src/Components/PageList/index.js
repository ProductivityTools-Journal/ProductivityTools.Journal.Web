import React, { useEffect, useState, useContext, useRef, useMemo } from "react";
import Page from "Components/Page";
import * as apiService from "services/apiService";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import AddIcon from "@mui/icons-material/Add";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import { v4 as uuid } from "uuid";
import * as Common from "../Common.js";
import { JournalTreeContext } from "Components/JournalContext/index.js";

export default function PageList({ selectedTreeNode, newPageTrigger }) {
  const [pages, setPages] = useState([]);
  const journalTreeContext = useContext(JournalTreeContext);
  const handledTriggerRef = useRef(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      if (!selectedTreeNode || selectedTreeNode.id == null) {
        setPages([]);
        return;
      }

      const data = await apiService.fetchPageList(selectedTreeNode.id);
      if (isCancelled) return;

      const formattedData = (data || []).map((element) => ({
        ...element,
        frontendId: element.frontendId || uuid(),
      }));

      if (
        newPageTrigger &&
        newPageTrigger.treeNodeId === selectedTreeNode.id &&
        handledTriggerRef.current !== newPageTrigger.timestamp
      ) {
        handledTriggerRef.current = newPageTrigger.timestamp;
        const newPage = Common.getNewPage(selectedTreeNode);
        newPage.mode = "edit";
        setPages([newPage, ...formattedData]);
      } else {
        setPages(formattedData);
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [selectedTreeNode?.id, newPageTrigger?.timestamp]);

  const updatePageInList = (page) => {
    return;
  };

  const newEvent = () => {
    let newPage = Common.getNewPage(selectedTreeNode);
    newPage.mode = "edit";
    setPages([newPage, ...pages]);
  };

  const checkState = () => {
    console.log(pages);
  };

  const sortedPages = useMemo(() => {
    if (!pages || pages.length === 0) return [];
    return [...pages].sort((a, b) => {
      const pinDiff = Number(b.pinned || 0) - Number(a.pinned || 0);
      if (pinDiff !== 0) return pinDiff;
      const dateA = a.date ? new Date(a.date).getTime() : Infinity;
      const dateB = b.date ? new Date(b.date).getTime() : Infinity;
      return dateB - dateA;
    });
  }, [pages]);

  return (
    <div style={{ color: "#3b3d3b" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: "14px 20px",
          mb: 3,
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
          backgroundColor: "#ffffff",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <FolderOutlinedIcon color="primary" />
          <Typography variant="h6" sx={{ fontSize: "1.1rem", fontWeight: 600, color: "#2c3e50" }}>
            {selectedTreeNode?.name || "All Notes"}
          </Typography>
          <Chip
            label={`${sortedPages.length} ${sortedPages.length === 1 ? "note" : "notes"}`}
            size="small"
            variant="outlined"
            color="default"
          />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {journalTreeContext?.debug && (
            <Button variant="outlined" size="small" onClick={checkState}>
              Check State
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={newEvent}
          >
            Add New Note
          </Button>
        </Box>
      </Box>

      {sortedPages.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 6,
            px: 3,
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            border: "1px dashed #d0d7de",
          }}
        >
          <Typography variant="h6" sx={{ color: "#555", mb: 0.5, fontSize: "1rem" }}>
            No notes in this folder
          </Typography>
          <Typography variant="body2" sx={{ color: "#888", mb: 2 }}>
            Click the button below to add your first note here.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={newEvent}
          >
            Add Note
          </Button>
        </Box>
      ) : (
        sortedPages.map(function (item) {
          return <Page page={item} updatePageInList={updatePageInList} key={item.frontendId} />;
        })
      )}
    </div>
  );
}
