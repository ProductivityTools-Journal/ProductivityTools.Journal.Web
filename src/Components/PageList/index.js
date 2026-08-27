import React, { useEffect, useState, useContext, useRef, useMemo } from "react";
import Page from "Components/Page";
import * as apiService from "services/apiService";
import Button from "@mui/material/Button";
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
    <div className="App" style={{ color: "#3b3d3b" }}>
      <Button onClick={newEvent}>Add New</Button>
      {journalTreeContext?.debug && <Button onClick={checkState}>Check State</Button>}

      {sortedPages.map(function (item) {
        return <Page page={item} updatePageInList={updatePageInList} key={item.frontendId} />;
      })}
    </div>
  );
}
