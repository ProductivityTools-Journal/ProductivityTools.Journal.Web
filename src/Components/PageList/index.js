import React, { useEffect, useState } from "react";
import Page from "Components/Page";
import * as apiService from "services/apiService";
import Button from "@mui/material/Button";
import { v4 as uuid } from "uuid";
import { useAuth } from "../../Session/AuthContext";
import * as Common from "../Common.js";

export default function PageList({ selectedTreeNode }) {
  const [pages, setPages] = useState([]);

  useEffect(() => {
    console.log("selectedTreeNode");
    console.log(selectedTreeNode);
    const fetchData = async () => {
      const data = await apiService.fetchPageList(selectedTreeNode.id);
      data.forEach((element) => {
        element.frontendId = uuid();
      });
      setPages(data);
    };
    if (selectedTreeNode != null) {
      fetchData();
    }
    //console.log("fetching data");
  }, [selectedTreeNode?.id]);

  useEffect(() => {
    const fetchData = async () => {
      let uniqueJournalIds = [];
      pages.forEach((x) => {
        if (uniqueJournalIds.includes(x.journalId) == false) {
          uniqueJournalIds.push(x.journalId);
        }
      });
      await apiService.getTreePaths(uniqueJournalIds);
      console.log(pages);
      console.log("XXXXXXXX");
      // debugger;
    };
    fetchData();
  }, [pages]);

  const updatePageInList = (page) => {
    return;
    // console.log("updateMeetingInList");
    // console.log(page);
    // console.log(pages);
    let updatedList = pages
      .map((item) => {
        if (item.frontendId === page.frontendId) {
          if (page.Deleted == true) {
            //do nothing
          } else {
            let r = { ...item, ...page };
            return r;
          }
        } else {
          return item;
        }
      })
      .filter((item) => item != undefined);
    debugger;
    setPages(updatedList);
  };

  const newEvent = () => {
    let newPage = Common.getNewPage(selectedTreeNode);
    newPage.mode = "edit";
    setPages([newPage, ...pages]);
    // console.log('new event');
    // console.log(newPage);
  };

  const checkState = () => {
    console.log(pages);
  };
  return (
    <div className="App" style={{ color: "#3b3d3b", marginLeft: "400px", width: "1200px" }}>
      <Button onClick={newEvent}>Add New</Button>
      <Button onClick={checkState}>CheckSatate</Button>

      {pages &&
        pages.length > 0 &&
        pages.map(function (item) {
          return <Page page={item} updatePageInList={updatePageInList} key={item.frontendId} />;
        })}
    </div>
  );
}
