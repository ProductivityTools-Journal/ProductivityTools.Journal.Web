import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ShareIcon from "@mui/icons-material/Share";
import PushPinIcon from "@mui/icons-material/PushPin";
import AttachFileIcon from "@mui/icons-material/AttachFile";
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
  createFontColorPlugin,
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
import ToolbarButtons, { openColorContextMenu } from "./ToolbarButtons";
import PageAnchor from "Components/PageAnchor";
import { JournalTreeContext } from "Components/JournalContext/index.js";
import statusService from "services/statusService";

const createTitlePlugin = createPluginFactory({
  key: "title",
  isElement: true,
});

const createParagraphAltPlugin = createPluginFactory({
  key: "paragraph",
  isElement: true,
});

const stripPolishDiacritics = (str) =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .toLowerCase();

const createTabletAutocompleteFixPlugin = createPluginFactory({
  key: "tabletAutocompleteFix",
  withOverrides: (editor) => {
    const { insertText } = editor;
    let isPasteOrDrop = false;

    editor._setPasteOrDrop = (val) => {
      isPasteOrDrop = val;
    };

    editor.insertText = (text) => {
      if (!isPasteOrDrop && typeof text === "string" && editor.selection) {
        const trimmed = text.trim();
        const { anchor, focus } = editor.selection;
        const isCollapsed =
          anchor &&
          focus &&
          anchor.offset === focus.offset &&
          anchor.path.length === focus.path.length &&
          anchor.path.every((v, i) => v === focus.path[i]);

        if (isCollapsed && trimmed.length >= 2 && !/^\s/.test(text) && !/\s/.test(trimmed)) {
          try {
            let node = editor;
            for (const idx of anchor.path) {
              node = node?.children?.[idx];
            }
            if (node && typeof node.text === "string") {
              const beforeCursor = node.text.slice(0, anchor.offset);
              const wordMatch = beforeCursor.match(/([^\s.,!?;:()[\]{}"'`~@#$%^&*+=<>\\/|]+)$/);
              if (wordMatch) {
                const typedWord = wordMatch[1];
                const normTrimmed = stripPolishDiacritics(trimmed);
                const normTyped = stripPolishDiacritics(typedWord);
                if (normTrimmed.startsWith(normTyped) && normTrimmed.length >= normTyped.length) {
                  const wordStartOffset = anchor.offset - typedWord.length;
                  if (typeof editor.select === "function") {
                    editor.select({
                      anchor: { path: anchor.path, offset: wordStartOffset },
                      focus: anchor,
                    });
                  }
                }
              }
            }
          } catch (_e) {}
        }
      }
      insertText(text);
    };

    return editor;
  },
  handlers: {
    onPaste: (editor) => () => {
      if (editor._setPasteOrDrop) {
        editor._setPasteOrDrop(true);
        setTimeout(() => editor._setPasteOrDrop(false), 0);
      }
    },
    onDrop: (editor) => () => {
      if (editor._setPasteOrDrop) {
        editor._setPasteOrDrop(true);
        setTimeout(() => editor._setPasteOrDrop(false), 0);
      }
    },
  },
});

let isRightAltDown = false;
if (typeof window !== "undefined") {
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.code === "AltRight") isRightAltDown = true;
    },
    true
  );
  window.addEventListener(
    "keyup",
    (e) => {
      if (e.code === "AltRight") isRightAltDown = false;
    },
    true
  );
  window.addEventListener("blur", () => {
    isRightAltDown = false;
  });
}

const LinkComponent = (props) => {
  const { attributes, children, element } = props;
  return (
    <a
      {...attributes}
      href={element.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: "#1976d2",
        textDecoration: "underline",
        cursor: "pointer",
        wordBreak: "break-word",
      }}
    >
      {children}
    </a>
  );
};

const plateUI = createPlateUI({
  title: withProps(StyledElement, {
    as: "h1",
    styles: {
      root: {
        margin: "6px 0 8px 0",
        fontSize: "22px",
        fontWeight: "700",
        color: "#1565c0",
      },
    },
  }),
  paragraph: withProps(StyledElement, {
    as: "p",
    styles: {
      root: {
        margin: "4px 0",
        lineHeight: 1.6,
      },
    },
  }),
  h1: withProps(StyledElement, {
    as: "h1",
    styles: {
      root: {
        margin: "18px 0 6px 0",
        fontSize: "20px",
        fontWeight: "700",
        color: "#222",
      },
    },
  }),
  h2: withProps(StyledElement, {
    as: "h2",
    styles: {
      root: {
        margin: "14px 0 4px 0",
        fontSize: "18px",
        fontWeight: "600",
        color: "#333",
      },
    },
  }),
  code_block: withProps(StyledElement, {
    as: "pre",
    styles: {
      root: {
        backgroundColor: "#f5f5f5",
        padding: "12px 16px",
        borderRadius: "6px",
        fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
        fontSize: "13px",
        lineHeight: "1.45",
        overflowX: "auto",
        margin: "10px 0",
        border: "1px solid #e0e0e0",
      },
    },
  }),
  code_line: withProps(StyledElement, {
    as: "div",
    styles: {
      root: {
        fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
        fontSize: "13px",
        whiteSpace: "pre-wrap",
      },
    },
  }),
  lic: withProps(StyledElement, {
    as: "span",
    styles: {
      root: {
        display: "inline",
      },
    },
  }),
  a: LinkComponent,
});

const platePlugins = createPlugins(
  [
    createBasicElementsPlugin(),
    createTitlePlugin(),
    createParagraphAltPlugin(),
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
    createFontColorPlugin({
      handlers: {
        onKeyDown: (editor) => (e) => {
          if (e.defaultPrevented) return;
          const lower = (e.key || "").toLowerCase();
          const isCtrlM =
            (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (lower === "m" || e.code === "KeyM");
          const isLeftAltC =
            e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && !isRightAltDown && (lower === "c" || e.code === "KeyC");
          if (isCtrlM || isLeftAltC) {
            e.preventDefault();
            e.stopPropagation();
            openColorContextMenu(editor);
          }
        },
      },
    }),
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
    createTabletAutocompleteFixPlugin(),
  ],
  {
    components: plateUI,
  }
);

function Page({ page, updatePageInList, key }) {
  //const { meeting, ...rest } = props;
  const [localPageObject, setLocalPageObject] = useState(() => {
    let pageContentObject = null;
    if (page?.contentType === "Slate") {
      try {
        pageContentObject = JSON.parse(page.content);
      } catch (error) {
        pageContentObject = Common.getObjectSlateStructureFromRawDetails("Title12", page.content);
      }
    } else {
      pageContentObject = Common.getObjectSlateStructureFromRawDetails("Title14", page?.content);
    }

    return {
      ...page,
      contentObject: pageContentObject,
      contentType: "Slate",
      mode: page?.mode === undefined ? "readonly" : page.mode,
    };
  });
  const [imageUrl, setImageUrl] = useState();
  const [journalPath, setJournalPath] = useState();
  const contentObjectRef = useRef(localPageObject?.contentObject);
  const editableProps = useMemo(() => ({ placeholder: "Type..." }), []);

  const journalTreeContext = useContext(JournalTreeContext);

  useEffect(() => {
    let pageContentObject = null;
    if (page.contentType === "Slate") {
      try {
        pageContentObject = JSON.parse(page.content);
      } catch (error) {
        pageContentObject = Common.getObjectSlateStructureFromRawDetails("Title12", page.content);
      }
    } else {
      pageContentObject = Common.getObjectSlateStructureFromRawDetails("Title14", page.content);
    }

    contentObjectRef.current = pageContentObject;
    let x = {
      ...page,
      contentObject: pageContentObject,
      contentType: "Slate",
      mode: page.mode === undefined ? "readonly" : page.mode,
    };
    setLocalPageObject(x);
  }, [page.pageId, page.frontendId, page.mode, page.content, page.contentType]);

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
    contentObjectRef.current = contentObject;
    setLocalPageObject({ ...localPageObject, contentObject: contentObject });
  };

  const edit = () => {
    const latestContent = contentObjectRef.current || localPageObject.contentObject;
    setLocalPageObject({ ...localPageObject, contentObject: latestContent, mode: "edit" });
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
    const latestContentObject = contentObjectRef.current || localPageObject.contentObject;
    localPageObject.contentObject = latestContentObject;
    localPageObject.contentType = "Slate";
    localPageObject.content = JSON.stringify(latestContentObject);
    localPageObject.plainText = Common.getPlainTextFromSlateStructure(latestContentObject);
    if (localPageObject.pageId == null) {
      let savedEvent = await apiService.savePage(localPageObject);

      eventSum = { ...localPageObject, ...savedEvent };
      setLocalPageObject(eventSum);
    } else {
      let updatedRes = await apiService.updateJournal(localPageObject);
      eventSum = {
        ...localPageObject,
        isOfflinePending: Boolean(updatedRes?.isOfflinePending),
      };
      setLocalPageObject(eventSum);
    }
    updatePageInList(eventSum);
  };

  const close = () => {
    const latestContentObject = contentObjectRef.current || localPageObject.contentObject;
    setLocalPageObject({ ...localPageObject, contentObject: latestContentObject, mode: "readonly" });
  };

  const deletePage = async () => {
    await apiService.deleteMeeting(localPageObject.pageId);
    const deletedObj = { ...localPageObject, Deleted: true };
    setLocalPageObject(deletedObj);
    updatePageInList(deletedObj);
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

  const copyPublicLink = async () => {
    const pageId = localPageObject?.pageId || page?.pageId;
    if (!pageId) {
      statusService.warn("Page is not saved yet");
      return;
    }
    const result = await apiService.getPagePublicHash(pageId);
    if (result) {
      const fullUrl = Common.getPagePublicUrl(result);
      await Common.copyTextToClipboard(fullUrl);
      statusService.success("Page public link copied to clipboard!");
    }
  };

  const getEditModeButtons = () => {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mt: 2,
          pt: 1.5,
          borderTop: "1px solid #f0f0f0",
          flexWrap: "wrap",
          "& .MuiButton-root": {
            height: 32,
            boxSizing: "border-box",
          },
        }}
      >
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<SaveIcon />}
          onClick={save}
        >
          Save
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          startIcon={<CloseIcon />}
          onClick={close}
        >
          Close
        </Button>
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<DeleteOutlineIcon />}
          onClick={deletePage}
        >
          Delete
        </Button>
        <Button
          variant={Boolean(localPageObject?.pinned) ? "contained" : "outlined"}
          color={Boolean(localPageObject?.pinned) ? "secondary" : "inherit"}
          size="small"
          startIcon={<PushPinIcon />}
          onClick={togglePinned}
        >
          Pinned
        </Button>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          startIcon={<ShareIcon />}
          onClick={copyPublicLink}
        >
          Public Link
        </Button>
        <PageAnchor page={page} removePageFromList={removePageFromList} size="small" />
        {journalTreeContext?.debug && (
          <>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setJournalPath(journalTreeContext.findPath(page.journalId));
              }}
            >
              Update Context
            </Button>
            <Button variant="outlined" size="small" onClick={checkState}>
              Check State
            </Button>
          </>
        )}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto" }}>
          <input
            accept="image/png, image/jpeg"
            id={`upload-file-${localPageObject.pageId || localPageObject.frontendId}`}
            type="file"
            style={{ display: "none" }}
            onChange={onFileChange}
          />
          <label htmlFor={`upload-file-${localPageObject.pageId || localPageObject.frontendId}`}>
            <Button
              variant="outlined"
              component="span"
              size="small"
              startIcon={<AttachFileIcon />}
            >
              Attach Image
            </Button>
          </label>
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Uploaded"
              style={{ maxHeight: 32, borderRadius: 4, border: "1px solid #e0e0e0" }}
            />
          )}
        </Box>
      </Box>
    );
  };

  const getReadOnlyModeButtons = () => {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mt: 2,
          pt: 1.5,
          borderTop: "1px solid #f0f0f0",
          flexWrap: "wrap",
          "& .MuiButton-root": {
            height: 32,
            boxSizing: "border-box",
          },
        }}
      >
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<EditIcon />}
          onClick={edit}
        >
          Edit
        </Button>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          startIcon={<ShareIcon />}
          onClick={copyPublicLink}
        >
          Public Link
        </Button>
        <PageAnchor page={page} removePageFromList={removePageFromList} size="small" />
      </Box>
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
    contentObjectRef.current = contentObject;
    localPageObject.contentObject = contentObject;
    if (journalTreeContext?.debug) {
      setLocalPageObject((prev) => ({ ...prev, contentObject }));
    }
  };

  const togglePinned = () => {
    const newPinned = !Boolean(localPageObject?.pinned);
    const latestContentObject = contentObjectRef.current || localPageObject.contentObject;
    localPageObject.pinned = newPinned;
    localPageObject.contentObject = latestContentObject;
    setLocalPageObject({ ...localPageObject, contentObject: latestContentObject, pinned: newPinned });
  };

  const getComponent2 = () => {
    if (localPageObject != null && localPageObject.Deleted !== true) {
      return (
        <div
          key={localPageObject.pageId || localPageObject.frontendId}
          className="journal-note-card report-plate-editor"
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
              pb: 0.75,
              borderBottom: "1px solid #f0f0f0",
              flexWrap: "wrap",
              gap: 0.75,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
              {journalPath && (
                <Chip
                  label={journalPath}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 22, fontSize: "0.75rem" }}
                />
              )}
              {Boolean(localPageObject?.pinned) && (
                <Chip
                  icon={<PushPinIcon style={{ fontSize: "0.85rem" }} />}
                  label="Pinned"
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{ height: 22, fontSize: "0.75rem" }}
                />
              )}
              {Boolean(localPageObject?.isOfflinePending) && (
                <Chip
                  label="Pending Sync"
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ height: 22, fontSize: "0.75rem", fontWeight: 600 }}
                />
              )}
              {localPageObject?.subject && localPageObject.subject !== "Page" && (
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#555", fontSize: "0.85rem", lineHeight: 1.2 }}>
                  {localPageObject.subject}
                </Typography>
              )}
              {journalTreeContext?.debug && (
                <Chip
                  label={`ID: ${localPageObject?.pageId || "new"} | Tree: ${localPageObject?.journalId}`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 22, fontSize: "0.75rem" }}
                />
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {page.date && (
                <Tooltip title={dtDescription}>
                  <Typography variant="caption" sx={{ color: "#888", fontSize: "0.75rem", lineHeight: 1 }}>
                    {dtFormated}
                  </Typography>
                </Tooltip>
              )}
            </Box>
          </Box>
          <Plate
            key={`${localPageObject.pageId || localPageObject.frontendId}-${localPageObject.mode}-${readonly() ? page?.content?.length || 0 : "edit"}`}
            initialValue={contentObjectRef.current || localPageObject.contentObject || [{ type: "p", children: [{ text: "" }] }]}
            onChange={contentChanged}
            plugins={platePlugins}
            readOnly={readonly()}
            editableProps={editableProps}
            firstChildren={
              !readonly() ? (
                <HeadingToolbar
                  style={{
                    marginBottom: "12px",
                    borderRadius: "6px",
                    background: "#f8f9fa",
                    border: "1px solid #e0e0e0",
                    flexWrap: "wrap",
                  }}
                >
                  <ToolbarButtons />
                </HeadingToolbar>
              ) : null
            }
          />
          {readonly() ? getReadOnlyModeButtons() : getEditModeButtons()}

          {journalTreeContext?.debug && (
            <Accordion sx={{ mt: 2, boxShadow: "none", border: "1px solid #e0e0e0" }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
                <Typography variant="body2" sx={{ color: "#666" }}>Debug Info</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <SlateEditor
                  pageId={localPageObject.pageId}
                  pageContentObject={localPageObject.contentObject}
                  readOnly={readonly()}
                  pageContentObjectChanged={pageContentObjectChanged}
                ></SlateEditor>
                <pre style={{ fontSize: "11px", overflowX: "auto", background: "#f5f5f5", padding: "8px", borderRadius: 4 }}>
                  {JSON.stringify(localPageObject.contentObject, null, 2)}
                </pre>
              </AccordionDetails>
            </Accordion>
          )}
        </div>
      );
    }
  };

  return <div>{getComponent2()}</div>;
}

export default Page;
