import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { createEditor, Editor, Transforms } from "slate";

let mockedPlateEditor = null;

jest.mock("@udecode/plate", () => {
  const actual = jest.requireActual("@udecode/plate");
  return {
    ...actual,
    Plate: ({ firstChildren }) => <div data-testid="mock-plate">{firstChildren}</div>,
    HeadingToolbar: ({ children }) => <div>{children}</div>,
    usePlateEditorState: () => mockedPlateEditor,
  };
});

jest.mock("Components/PageAnchor", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("Components/SlateEditor", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("services/imageService", () => ({
  extractImageFilesFromDataTransfer: jest.fn(() => []),
  insertImageFilesIntoEditor: jest.fn(),
  getActiveUploadCount: jest.fn(() => 0),
  subscribeUploadCount: jest.fn(() => () => {}),
}));

jest.mock("services/apiService", () => ({
  savePage: jest.fn(),
  updateJournal: jest.fn(),
  getGetTaskInboxes: jest.fn(),
  createGetTaskFromNote: jest.fn(),
  setGetTaskInbox: jest.fn(),
}));

import * as apiService from "services/apiService";
import { JournalTreeContext } from "Components/JournalContext";
import { ELEMENT_GETTASK_TASK, triggerGetTaskAction } from "../GetTaskPlugin";
import Page from "../index";

async function flushAsync() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function findButtonByText(regex) {
  const buttons = Array.from(document.body.querySelectorAll("button"));
  return buttons.find((btn) => regex.test(btn.textContent || "")) || null;
}

describe("Page unsaved note -> Create GetTask task flow (no duplicate Page/New)", () => {
  let container;
  let root;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window.navigator, "onLine", {
      value: true,
      configurable: true,
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    const editor = createEditor();
    const { isInline } = editor;
    editor.isInline = (el) => (el.type === ELEMENT_GETTASK_TASK ? true : isInline(el));
    editor.id = "plate-unsaved-frontend-1";
    editor.children = [
      { type: "title", children: [{ text: "Nowa notatka" }] },
      { type: "p", children: [{ text: "Wysłać umowę do klienta" }] },
    ];
    Editor.normalize(editor, { force: true });
    Transforms.select(editor, {
      anchor: { path: [1, 0], offset: 0 },
      focus: { path: [1, 0], offset: 23 },
    });
    mockedPlateEditor = editor;
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    mockedPlateEditor = null;
  });

  test("calls savePage (Page/New) ONCE and updateJournal (Page/Update) ONCE with assigned pageId", async () => {
    apiService.getGetTaskInboxes.mockResolvedValue([
      { elementId: 42, inboxName: "WorkInbox", name: "Work", path: "Praca" },
    ]);
    apiService.savePage.mockResolvedValue({
      pageId: 842,
      journalId: 15,
      date: "2026-11-27T16:00:00Z",
    });
    apiService.createGetTaskFromNote.mockResolvedValue({
      getTaskElementId: 777,
      getTaskUrl: "https://pt-tasks.web.app/?task=777",
      inboxElementId: 42,
      inboxName: "WorkInbox",
      alreadyExisted: false,
    });
    apiService.updateJournal.mockResolvedValue({ isOfflinePending: false });

    const updatePageInList = jest.fn();
    const unsavedPage = {
      frontendId: "unsaved-frontend-1",
      pageId: null,
      journalId: 15,
      mode: "edit",
      subject: "Page",
      contentType: "Slate",
      content: JSON.stringify(mockedPlateEditor.children),
    };

    const ctxValue = {
      journalTree: null,
      setJournalTree: jest.fn(),
      findPath: jest.fn(() => "Praca>>Projekt"),
      resolveGetTaskInbox: jest.fn(() => ({
        getTaskInboxElementId: 42,
        getTaskInboxName: "WorkInbox",
        sourceJournalId: 10,
        sourceJournalName: "Praca",
        inherited: true,
      })),
      findKorzen: jest.fn(() => ({ id: 10, name: "Praca", parentId: 1 })),
      updateNodeGetTaskInbox: jest.fn(),
      treeRefreshVersion: 0,
      requestTreeRefresh: jest.fn(),
      debug: false,
      setDebug: jest.fn(),
    };

    act(() => {
      root.render(
        <JournalTreeContext.Provider value={ctxValue}>
          <Page
            page={unsavedPage}
            updatePageInList={updatePageInList}
            isHighlighted={false}
          />
        </JournalTreeContext.Provider>
      );
    });
    await flushAsync();

    act(() => {
      triggerGetTaskAction(mockedPlateEditor);
    });
    await flushAsync();

    const sendBtn = findButtonByText(/Wyślij do GetTask3/i);
    expect(sendBtn).not.toBeNull();
    act(() => {
      sendBtn.click();
    });
    await flushAsync();
    await flushAsync();

    // Critical invariant: Page/New called ONCE, Page/Update called ONCE with pageId 842
    expect(apiService.savePage).toHaveBeenCalledTimes(1);
    expect(apiService.createGetTaskFromNote).toHaveBeenCalledTimes(1);
    expect(apiService.createGetTaskFromNote).toHaveBeenCalledWith(
      expect.objectContaining({
        pageId: 842,
        journalId: 15,
        title: "Wysłać umowę do klienta",
      })
    );
    expect(apiService.updateJournal).toHaveBeenCalledTimes(1);

    const updatedPayload = apiService.updateJournal.mock.calls[0][0];
    expect(updatedPayload.pageId).toBe(842);
    expect(updatedPayload.journalId).toBe(15);
    const savedAst = JSON.parse(updatedPayload.content);
    expect(JSON.stringify(savedAst)).toContain('"type":"gettask_task"');
    expect(JSON.stringify(savedAst)).toContain('"getTaskId":777');
    expect(JSON.stringify(savedAst)).toContain('"syncStatus":"synced"');
  });
});
