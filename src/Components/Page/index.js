import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import * as moment from "moment";
import NotesLabel from "Components/NotesLabel";
import Notes from "Components/Notes";
import * as apiService from "services/apiService";
import { v4 as uuid } from "uuid";
import { useDrag } from "react-dnd";
import * as Common from "../Common.js";
import SlateEditor from "Components/SlateEditor";
import { PTPlate } from "productivitytools.plate";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

function Page({ page, updatePageInList, key }) {
  //const { meeting, ...rest } = props;
  const [localPageObject, setLocalPageObject] = useState();

  useEffect(() => {
    console.log("FFFFFFFFFFF use effect");
    let pageContentObject = null;
    if (page.contentType == "Slate") {
      try {
        pageContentObject = JSON.parse(page.content);
      } catch (error) {
        pageContentObject = Common.getObjectSlateStructureFromRawDetails("Title12", page.content);
      }
    } else {
      pageContentObject = Common.getObjectSlateStructureFromRawDetails("Title14", page.content);
    }

    let x = {
      ...page,
      contentObject: pageContentObject,
      contentType: "Slate",
      mode: page.mode == undefined ? "readonly" : page.mode,
    };
    setLocalPageObject(x);
  }, [page.pageID]);

  // const [mode, setMode] = useState('readonly');
  let mt = moment(page.date);
  let dtDescription = mt.fromNow();
  let dtFormated = mt.format("YYYY.MM.DD hh:mm");
  const buttonStyle = { textAlign: "left" };

  const pageContentObjectChanged = (contentObject) => {
    // console.log("pageContentObjectChanged");
    // console.log(contentObject);
    setLocalPageObject({ ...localPageObject, contentObject: contentObject });
  };

  const edit = () => {
    //console.log()
    //setMode('edit');
    setLocalPageObject({ ...localPageObject, mode: "edit" });
  };

  const updateState = (event) => {
    const value = event.target.value;
    const name = event.target.name;
    setLocalPageObject((prev) => ({ ...prev, [name]: value }));
  };

  const updateElementInList = (value, journalItemDetailsGuid, field) => {
    let journalItemDetailNotes = value;
    let notes = localPageObject.contentList;
    var editedElement = notes.find((x) => x.guid === journalItemDetailsGuid);
    editedElement[field] = journalItemDetailNotes;
    setLocalPageObject((prevMeeting) => ({ ...prevMeeting, notesList: notes }));
  };
  // const newJournalItemDetails = () => {
  // 	let newNotesList = [...localPageObject.contentList, { type: 'new', notes: 'Add notes here', guid: uuid(), status: 'New' }]
  // 	setLocalPageObject(prevlocalPageObject => ({ ...prevlocalPageObject, notesList: newNotesList }));
  // }

  const save = async () => {
    let eventSum = undefined; //we need it to keep mode=edit, which is not returned from server
    localPageObject.contentType = "Slate";
    localPageObject.content = JSON.stringify(localPageObject.contentObject);
    if (localPageObject.pageId == null) {
      let savedEvent = await apiService.savePage(localPageObject);

      eventSum = { ...localPageObject, ...savedEvent };
      setLocalPageObject(eventSum);
    } else {
      apiService.updateJournal(localPageObject);
    }
    updatePageInList(eventSum);
  };

  const close = () => {
    setLocalPageObject({ ...localPageObject, mode: "readonly" });
  };

  const deletePage = () => {
    //console.log("delete whole journal item")
    //console.log(localPageObject);
    apiService.deleteMeeting(localPageObject.pageId);
    setLocalPageObject({ ...localPageObject, Deleted: true });
    //removePageFromList(localPageObject);
  };

  const removePageFromList = (page) => {
    page.Deleted = true;
    updatePageInList(page);
    setLocalPageObject(page);
  };

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "page",
    item: { page: page, removePageFromList: removePageFromList },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const checkState = () => {
    console.log(page);
    console.log(pageContentObjectChanged);
  };

  const onFileChange = async (event) => {
    console.log(event.target.files);
    if (event.target.files.length > 0) {
      let file = event.target.files[0];
      console.log("invoke service.uploadPhoto");
      console.log(page);
      var r = await apiService.uploadPhoto(file, page.pageId);
      console.log("onFileUpload");
      console.log(r);
    }
  };

  const getEditModeButtons = () => {
    return (
      <p style={buttonStyle}>
        <Button variant="contained" color="primary" onClick={save}>
          {" "}
          Save
        </Button>
        <Button variant="contained" color="primary" onClick={close}>
          Close
        </Button>
        <Button variant="outlined" color="primary" onClick={deletePage}>
          Delete page
        </Button>
        <Button variant="outlined" color="primary" onClick={checkState}>
          CheckState
        </Button>
        <input type="file" accept="image/png, image/jpg" onChange={onFileChange} />
      </p>
    );
  };

  const getReadOnlyModeButtons = () => {
    return (
      <p style={buttonStyle}>
        <Button variant="contained" color="primary" onClick={edit}>
          Edit
        </Button>
      </p>
    );
  };
  // const getComponent = () => {
  // 	//console.log("working event");
  // 	//console.log(page);
  // 	if (localPageObject != null) {
  // 		if (localPageObject.mode == null || localPageObject.mode === 'readonly') {
  // 			return (
  // 				<fieldset key={localPageObject.pageId} ref={drag}>
  // 					<p>mode: {localPageObject.mode}  <span>{isDragging && '😱'}</span></p>
  // 					<p>PageId: {localPageObject.pageId}</p>
  // 					<legend>[{localPageObject.pageId}] {dtFormated} ({dtDescription}) - {localPageObject.subject} Treeid:{localPageObject.journalId}</legend>
  // 					<SlateEditor pageId={localPageObject.pageId} pageContentObject={localPageObject.contentObject} readOnly={true} pageContentObjectChanged={pageContentObjectChanged}></SlateEditor>

  // 					{getReadOnlyModeButtons()}
  // 				</fieldset>
  // 			)
  // 		}
  // 		else {

  // 			return (<fieldset>
  // 				<p>Title: {localPageObject.subject}</p>
  // 				<p>PageId: {localPageObject.pageId}</p>
  // 				<hr></hr>
  // 				<SlateEditor pageId={localPageObject.pageId} pageContentObject={localPageObject.contentObject} readOnly={false} pageContentObjectChanged={pageContentObjectChanged}></SlateEditor>
  // 				{getEditModeButtons()}
  // 			</fieldset>)
  // 		}
  // 	}
  // }

  const readonly = () => localPageObject.mode === "readonly";

  const contentChanged = (contentObject) => {
    console.log("content changed");
    console.log(contentObject);
    setLocalPageObject({ ...localPageObject, contentObject: contentObject });
    console.log(localPageObject);
  };

  const getComponent2 = () => {
    console.log(localPageObject);
    console.log("Get Component");
    if (localPageObject != null && localPageObject.Deleted != true) {
      //console.log(localPageObject.mode)
      return (
        <fieldset key={localPageObject.pageId} ref={drag}>
          {/* <p>mode: {localPageObject.mode}  </p> */}
          {/* <p>PageId: {localPageObject.pageId}</p> */}
          <legend>
            [{localPageObject?.pageId}] {dtFormated} ({dtDescription}) - {localPageObject?.subject} Treeid:
            {localPageObject?.journalId} <span>{isDragging && "😱"}</span>
          </legend>
          {/* <legend>[{localPageObject?.pageId}] {dtFormated} ({dtDescription}) - {localPageObject?.subject} </legend> */}

          <PTPlate content={localPageObject.contentObject} contentChanged={contentChanged}></PTPlate>
          {readonly() ? getReadOnlyModeButtons() : getEditModeButtons()}

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
              <Typography>Plate</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <SlateEditor
                pageId={localPageObject.pageId}
                pageContentObject={localPageObject.contentObject}
                readOnly={readonly()}
                pageContentObjectChanged={pageContentObjectChanged}
              ></SlateEditor>
              <span>{JSON.stringify(localPageObject.contentObject)}</span>
            </AccordionDetails>
          </Accordion>
        </fieldset>
      );
    }
  };

  return <div>{getComponent2()}</div>;
}

export default Page;
