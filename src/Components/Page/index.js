import React, { useState, useEffect, useContext } from "react";
import Button from "@mui/material/Button";
import * as moment from "moment";
import NotesLabel from "Components/NotesLabel";
import Notes from "Components/Notes";
import * as apiService from "services/apiService";
import { v4 as uuid } from "uuid";
import * as Common from "../Common.js";
import SlateEditor from "Components/SlateEditor";
import {
  Plate,
  HeadingToolbar,
  PlateFloatingLink,
  createPlateUI,
  createPlugins,
  createBasicElementsPlugin,
  createBasicMarksPlugin,
  createHeadingPlugin,
  createBlockquotePlugin,
  createCodeBlockPlugin,
  createParagraphPlugin,
  createBoldPlugin,
  createItalicPlugin,
  createUnderlinePlugin,
  createStrikethroughPlugin,
  createCodePlugin,
  createListPlugin,
  createIndentPlugin,
  createTablePlugin,
  createLinkPlugin,
  createImagePlugin,
  createMediaEmbedPlugin,
  createExitBreakPlugin,
  createSoftBreakPlugin,
  createResetNodePlugin,
  createNormalizeTypesPlugin,
  createTrailingBlockPlugin,
  createPluginFactory,
  withProps,
  StyledElement,
  KEYS_HEADING,
  ELEMENT_PARAGRAPH,
  ELEMENT_BLOCKQUOTE,
  ELEMENT_CODE_BLOCK,
  isBlockAboveEmpty,
  isCodeBlockEmpty,
  isSelectionAtBlockStart,
  isSelectionAtCodeBlockStart,
  unwrapCodeBlock,
} from "@udecode/plate";
import ToolbarButtons from "./ToolbarButtons";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PageAnchor from "Components/PageAnchor";
import { JournalTreeContext } from "Components/JournalContext/index.js";

const createTitlePlugin = createPluginFactory({
  key: "title",
  isElement: true,
});

const plateUI = createPlateUI({
  title: withProps(StyledElement, {
    styles: {
      root: {
        margin: "0 0 0 0",
        fontSize: "25px",
        fontWeight: "1000",
        color: "gray",
      },
    },
  }),
  h1: withProps(StyledElement, {
    styles: {
      root: {
        margin: "0 0 0 0",
        fontSize: "20px",
        fontWeight: "1000",
      },
    },
  }),
});

const platePlugins = createPlugins(
  [
    createBasicElementsPlugin(),
    createTitlePlugin(),
    createNormalizeTypesPlugin({
      options: {
        rules: [{ path: [0], strictType: "title" }],
      },
    }),
    createTrailingBlockPlugin({
      options: {
        type: "p",
      },
    }),
    createExitBreakPlugin({
      options: {
        rules: [
          {
            hotkey: "mod+enter",
          },
          {
            hotkey: "mod+shift+enter",
            before: true,
          },
          {
            hotkey: "enter",
            query: {
              start: true,
              end: true,
              allow: [...KEYS_HEADING, "title"],
            },
            relative: true,
            level: 1,
          },
        ],
      },
    }),
    createResetNodePlugin({
      options: {
        rules: [
          {
            types: [ELEMENT_BLOCKQUOTE],
            defaultType: ELEMENT_PARAGRAPH,
            hotkey: "Enter",
            predicate: isBlockAboveEmpty,
          },
          {
            types: [ELEMENT_BLOCKQUOTE],
            defaultType: ELEMENT_PARAGRAPH,
            hotkey: "Backspace",
            predicate: isSelectionAtBlockStart,
          },
          {
            types: [ELEMENT_CODE_BLOCK],
            defaultType: ELEMENT_PARAGRAPH,
            onReset: unwrapCodeBlock,
            hotkey: "Enter",
            predicate: isCodeBlockEmpty,
          },
          {
            types: [ELEMENT_CODE_BLOCK],
            defaultType: ELEMENT_PARAGRAPH,
            onReset: unwrapCodeBlock,
            hotkey: "Backspace",
            predicate: isSelectionAtCodeBlockStart,
          },
        ],
      },
    }),
    createBasicMarksPlugin(),
    createHeadingPlugin(),
    createBlockquotePlugin(),
    createCodeBlockPlugin(),
    createParagraphPlugin(),
    createBoldPlugin(),
    createItalicPlugin(),
    createUnderlinePlugin(),
    createStrikethroughPlugin(),
    createCodePlugin(),
    createListPlugin(),
    createIndentPlugin({
      offset: 24,
      unit: "px",
    }),
    createTablePlugin({
      options: {
        initialTableWidth: 600,
      },
    }),
    createLinkPlugin({
      renderAfterEditable: PlateFloatingLink,
    }),
    createImagePlugin(),
    createMediaEmbedPlugin(),
    createSoftBreakPlugin(),
  ],
  {
    components: plateUI,
  }
);

function Page({ page, updatePageInList, key }) {
  //const { meeting, ...rest } = props;
  const [localPageObject, setLocalPageObject] = useState();
  const [imageUrl, setImageUrl] = useState();
  const [journalPath, setJournalPath] = useState();

  const journalTreeContext = useContext(JournalTreeContext);

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

  useEffect(() => {
    
    setJournalPath(journalTreeContext.findPath(page.journalId));
  }, [page.journalId]);

  useEffect(() => {
    const fetchData = async () => {
      // const data = await apiService.getTreePath(page.journalId);
      // setJournalPath(data);
      // console.log(data);
    };
    if (page != null) {
      // fetchData();
    }
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
      var r = await apiService.uploadPhoto(file, page.journalId, page.pageId);
      console.log("onFileUpload");
      setImageUrl(r);
      console.log(r);
    }
  };

  const getEditModeButtons = () => {
    return (
      <p style={buttonStyle}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setJournalPath(journalTreeContext.findPath(page.journalId));
          }}
        >
          Update context
        </Button>
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
        <span>{imageUrl}</span>
        <img src={imageUrl}></img>
      </p>
    );
  };

  const getReadOnlyModeButtons = () => {
    return (
      <p style={buttonStyle}>
        <Button variant="contained" color="primary" onClick={edit}>
          edit1
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

  const pinnedChanged=(e)=>{
    console.log("pinnedChanged",e.target.checked)
    setLocalPageObject({ ...localPageObject, pinned: e.target.checked });
  }

  const getComponent2 = () => {
    console.log(localPageObject);
    console.log("Get Component");
    if (localPageObject != null && localPageObject.Deleted != true) {
      //console.log(localPageObject.mode)
      return (
        <fieldset key={localPageObject.pageId}>
          {/* <p>mode: {localPageObject.mode}  </p> */}
          {/* <p>PageId: {localPageObject.pageId}</p> */}
          <legend>
            [{localPageObject?.pageId}] {dtFormated} ({dtDescription}) - {localPageObject?.subject} Treeid:
            {localPageObject?.journalId}
          </legend>
          {/* <legend>[{localPageObject?.pageId}] {dtFormated} ({dtDescription}) - {localPageObject?.subject} </legend> */}
          <PageAnchor page={page} removePageFromList={removePageFromList}></PageAnchor>
          <span><input type="checkbox" onClick={pinnedChanged} checked={localPageObject.pinned}></input>Pinned</span><br/>
          <span>{journalPath}</span>
          <Plate
            key={`${localPageObject.pageId || localPageObject.frontendId}-${localPageObject.mode}`}
            initialValue={localPageObject.contentObject || [{ type: "p", children: [{ text: "" }] }]}
            value={localPageObject.contentObject || [{ type: "p", children: [{ text: "" }] }]}
            onChange={contentChanged}
            plugins={platePlugins}
            readOnly={readonly()}
            editableProps={{ placeholder: "Type..." }}
            firstChildren={
              <HeadingToolbar>
                <ToolbarButtons />
              </HeadingToolbar>
            }
          />
          {readonly() ? getReadOnlyModeButtons() : getEditModeButtons()}

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
              <Typography>Debuginfo</Typography>
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
