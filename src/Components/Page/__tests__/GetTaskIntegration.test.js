import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { createEditor, Editor, Element, Transforms } from "slate";

jest.mock("services/apiService", () => ({
  getGetTaskInboxes: jest.fn(),
  createGetTaskFromNote: jest.fn(),
  setGetTaskInbox: jest.fn(),
}));

import * as apiService from "services/apiService";
import { JournalTreeContext } from "Components/JournalContext";
import {
  ELEMENT_GETTASK_TASK,
  createGetTaskPlugin,
  splitSelectionTextToTitleAndDetails,
  wrapSelectionWithGetTask,
  patchGetTaskNode,
  unwrapGetTaskNode,
  unwrapGetTaskInAst,
  findGetTaskNodeByClientId,
  triggerGetTaskAction,
  notifyGetTaskChipClick,
  subscribeGetTaskTrigger,
} from "../GetTaskPlugin";
import GetTaskPopovers from "../GetTaskPopovers";

function createTestEditor(initialChildren) {
  const editor = createEditor();
  const { isInline } = editor;
  editor.isInline = (element) =>
    element.type === ELEMENT_GETTASK_TASK ? true : isInline(element);
  editor.id = "test-editor-1";
  editor.children = initialChildren;
  Editor.normalize(editor, { force: true });
  return editor;
}

async function flushAsync() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function findButtonByText(regex) {
  const buttons = Array.from(document.body.querySelectorAll("button"));
  return buttons.find((btn) => regex.test(btn.textContent || "")) || null;
}

function findLinkByText(regex) {
  const links = Array.from(document.body.querySelectorAll("a"));
  return links.find((a) => regex.test(a.textContent || "")) || null;
}

describe("GetTaskPlugin AST helpers and hotkey", () => {
  test("splitSelectionTextToTitleAndDetails handles single line, multi-line, and >200 char overflow", () => {
    expect(splitSelectionTextToTitleAndDetails("  Kupić mleko  ")).toEqual({
      title: "Kupić mleko",
      detailsText: "",
    });

    expect(
      splitSelectionTextToTitleAndDetails("Zadanie główne\nLinia 2\n\nLinia 3")
    ).toEqual({
      title: "Zadanie główne",
      detailsText: "Linia 2\nLinia 3",
    });

    const longLine = "word ".repeat(50).trim(); // 249 chars
    const split = splitSelectionTextToTitleAndDetails(longLine, 200);
    expect(split.title.length).toBeLessThanOrEqual(200);
    expect(split.detailsText.length).toBeGreaterThan(0);
    expect(`${split.title} ${split.detailsText}`).toBe(longLine);
  });

  test("wrapSelectionWithGetTask wraps single-block selection and patches/unwraps cleanly", () => {
    const editor = createTestEditor([
      { type: "title", children: [{ text: "Notatka" }] },
      { type: "p", children: [{ text: "Trzeba wysłać fakturę jutro" }] },
    ]);

    const selection = {
      anchor: { path: [1, 0], offset: 7 },
      focus: { path: [1, 0], offset: 21 },
    };

    const ok = wrapSelectionWithGetTask(editor, selection, {
      clientTaskId: "cid-1",
      inboxElementId: 42,
      inboxName: "Work",
      syncStatus: "pending",
    });
    expect(ok).toBe(true);

    const entry = findGetTaskNodeByClientId(editor, "cid-1");
    expect(entry).not.toBeNull();
    expect(entry[0].type).toBe(ELEMENT_GETTASK_TASK);
    expect(entry[0].syncStatus).toBe("pending");
    expect(Editor.string(editor, entry[1])).toBe("wysłać fakturę");

    patchGetTaskNode(editor, "cid-1", {
      getTaskId: 500,
      syncStatus: "synced",
    });
    const patched = findGetTaskNodeByClientId(editor, "cid-1");
    expect(patched[0].getTaskId).toBe(500);
    expect(patched[0].syncStatus).toBe("synced");

    unwrapGetTaskNode(editor, "cid-1");
    expect(findGetTaskNodeByClientId(editor, "cid-1")).toBeNull();
    expect(Editor.string(editor, [1])).toBe("Trzeba wysłać fakturę jutro");
  });

  test("wrapSelectionWithGetTask on multi-block selection wraps only first block slice (Slate inline invariant)", () => {
    const editor = createTestEditor([
      { type: "title", children: [{ text: "Tytuł" }] },
      { type: "p", children: [{ text: "Pierwsza linia zadania" }] },
      { type: "p", children: [{ text: "Druga linia ze szczegółami" }] },
    ]);

    const multiBlockSelection = {
      anchor: { path: [1, 0], offset: 9 },
      focus: { path: [2, 0], offset: 11 },
    };

    wrapSelectionWithGetTask(editor, multiBlockSelection, {
      clientTaskId: "cid-multi",
      inboxElementId: 42,
      inboxName: "Work",
      syncStatus: "pending",
    });

    const allTaskNodes = Array.from(
      Editor.nodes(editor, {
        at: [],
        match: (n) => Element.isElement(n) && n.type === ELEMENT_GETTASK_TASK,
      })
    );
    expect(allTaskNodes).toHaveLength(1);
    expect(Editor.string(editor, allTaskNodes[0][1])).toBe("linia zadania");
    expect(Editor.string(editor, [2])).toBe("Druga linia ze szczegółami");
  });

  test("unwrapGetTaskInAst removes only matching clientTaskId wrapper while preserving text", () => {
    const ast = [
      {
        type: "p",
        children: [
          { text: "Start " },
          {
            type: ELEMENT_GETTASK_TASK,
            clientTaskId: "cid-remove",
            getTaskId: 10,
            children: [{ text: "zadanie", bold: true }],
          },
          { text: " end" },
        ],
      },
    ];
    expect(unwrapGetTaskInAst(ast, "cid-remove")).toEqual([
      {
        type: "p",
        children: [
          { text: "Start " },
          { text: "zadanie", bold: true },
          { text: " end" },
        ],
      },
    ]);
  });

  test("Ctrl+Shift+T triggers GetTask action, while AltGr/altKey is ignored", () => {
    const plugin = createGetTaskPlugin();
    const editor = createTestEditor([{ type: "p", children: [{ text: "x" }] }]);
    const handler = plugin.handlers.onKeyDown(editor);

    const listener = jest.fn();
    const unsub = subscribeGetTaskTrigger(listener);

    const validEvent = {
      ctrlKey: true,
      shiftKey: true,
      altKey: false,
      metaKey: false,
      key: "T",
      code: "KeyT",
      defaultPrevented: false,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    };
    handler(validEvent);
    expect(validEvent.preventDefault).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledWith(editor);

    listener.mockClear();
    const altGrEvent = {
      ...validEvent,
      altKey: true,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    };
    handler(altGrEvent);
    expect(listener).not.toHaveBeenCalled();

    unsub();
  });
});

describe("GetTaskPopovers Create and View flows", () => {
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
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  function mountPopovers({
    editor,
    page,
    isReadOnly = false,
    resolvedInbox = {
      getTaskInboxElementId: 42,
      getTaskInboxName: "WorkInbox",
      sourceJournalId: 10,
      sourceJournalName: "Praca",
      inherited: true,
    },
    korzen = { id: 10, name: "Praca", parentId: 1 },
    ensurePageSaved = jest.fn(async () => ({ ...page, pageId: page.pageId ?? 842 })),
    persistCurrentAst = jest.fn(async () => {}),
    updateNodeGetTaskInbox = jest.fn(),
  }) {
    const editorRef = { current: editor };
    const ctxValue = {
      journalTree: null,
      setJournalTree: jest.fn(),
      findPath: jest.fn(),
      resolveGetTaskInbox: jest.fn(() => resolvedInbox),
      findKorzen: jest.fn(() => korzen),
      updateNodeGetTaskInbox,
      treeRefreshVersion: 0,
      requestTreeRefresh: jest.fn(),
      debug: false,
      setDebug: jest.fn(),
    };

    act(() => {
      root.render(
        <JournalTreeContext.Provider value={ctxValue}>
          <GetTaskPopovers
            editorRef={editorRef}
            page={page}
            isReadOnly={isReadOnly}
            ensurePageSaved={ensurePageSaved}
            persistCurrentAst={persistCurrentAst}
            getPageTitle={() => "Notatka"}
          />
        </JournalTreeContext.Provider>
      );
    });

    return { ensurePageSaved, persistCurrentAst, updateNodeGetTaskInbox };
  }

  test("Create flow: saves unsaved note, wraps selection, sends to API, patches synced, persists AST", async () => {
    const editor = createTestEditor([
      { type: "title", children: [{ text: "Notatka" }] },
      { type: "p", children: [{ text: "Zadanie do wysłania" }] },
    ]);
    Transforms.select(editor, {
      anchor: { path: [1, 0], offset: 0 },
      focus: { path: [1, 0], offset: 19 },
    });

    apiService.getGetTaskInboxes.mockResolvedValue([
      { elementId: 42, inboxName: "WorkInbox", name: "Work", path: "Praca" },
    ]);
    apiService.createGetTaskFromNote.mockResolvedValue({
      getTaskElementId: 777,
      getTaskUrl: "https://pt-tasks.web.app/?task=777",
      inboxElementId: 42,
      inboxName: "WorkInbox",
      alreadyExisted: false,
    });

    const { ensurePageSaved, persistCurrentAst } = mountPopovers({
      editor,
      page: { pageId: null, journalId: 15, subject: "Page" },
    });

    act(() => {
      triggerGetTaskAction(editor);
    });
    await flushAsync();

    const input = document.body.querySelector('input[value="Zadanie do wysłania"]');
    expect(input).not.toBeNull();

    const sendBtn = findButtonByText(/Wyślij do GetTask3/i);
    expect(sendBtn).not.toBeNull();
    act(() => {
      sendBtn.click();
    });
    await flushAsync();

    expect(ensurePageSaved).toHaveBeenCalledTimes(1);
    expect(apiService.createGetTaskFromNote).toHaveBeenCalledWith(
      expect.objectContaining({
        pageId: 842,
        journalId: 15,
        title: "Zadanie do wysłania",
        overrideInboxElementId: null,
      })
    );
    expect(persistCurrentAst).toHaveBeenCalledTimes(1);

    const nodes = Array.from(
      Editor.nodes(editor, {
        at: [],
        match: (n) => Element.isElement(n) && n.type === ELEMENT_GETTASK_TASK,
      })
    );
    expect(nodes).toHaveLength(1);
    expect(nodes[0][0].getTaskId).toBe(777);
    expect(nodes[0][0].syncStatus).toBe("synced");
  });

  test("404 INBOX_DELETED unwraps pending node and keeps popover open to choose replacement inbox", async () => {
    const editor = createTestEditor([
      { type: "title", children: [{ text: "Notatka" }] },
      { type: "p", children: [{ text: "Naprawić błąd" }] },
    ]);
    Transforms.select(editor, {
      anchor: { path: [1, 0], offset: 0 },
      focus: { path: [1, 0], offset: 13 },
    });

    apiService.getGetTaskInboxes.mockResolvedValue([
      { elementId: 88, inboxName: "NewInbox", name: "New", path: "Nowy" },
    ]);
    const deletedErr = new Error("Inbox deleted");
    deletedErr.status = 404;
    deletedErr.code = "INBOX_DELETED";
    apiService.createGetTaskFromNote.mockRejectedValueOnce(deletedErr);

    mountPopovers({
      editor,
      page: { pageId: 842, journalId: 15, subject: "Notatka" },
    });

    act(() => {
      triggerGetTaskAction(editor);
    });
    await flushAsync();

    act(() => {
      findButtonByText(/Wyślij do GetTask3/i).click();
    });
    await flushAsync();

    expect(document.body.textContent).toMatch(/Domyślny inbox został usunięty w GetTask3/i);

    // Submit button must be disabled until user selects a replacement inbox
    const submitBtnAfterError = findButtonByText(/Wyślij do GetTask3/i);
    expect(submitBtnAfterError).not.toBeNull();
    expect(submitBtnAfterError.disabled).toBe(true);

    const taskNodes = Array.from(
      Editor.nodes(editor, {
        at: [],
        match: (n) => Element.isElement(n) && n.type === ELEMENT_GETTASK_TASK,
      })
    );
    expect(taskNodes).toHaveLength(0);
    expect(Editor.string(editor, [1])).toBe("Naprawić błąd");
  });

  test("Transient error marks node failed and 1-click Retry reuses the exact same clientTaskId", async () => {
    const editor = createTestEditor([
      { type: "title", children: [{ text: "Notatka" }] },
      { type: "p", children: [{ text: "Ponów mnie" }] },
    ]);
    Transforms.select(editor, {
      anchor: { path: [1, 0], offset: 0 },
      focus: { path: [1, 0], offset: 10 },
    });

    apiService.getGetTaskInboxes.mockResolvedValue([
      { elementId: 42, inboxName: "WorkInbox" },
    ]);

    const transientErr = new Error("Service unavailable");
    transientErr.status = 503;
    apiService.createGetTaskFromNote
      .mockRejectedValueOnce(transientErr)
      .mockResolvedValueOnce({
        getTaskElementId: 901,
        getTaskUrl: "https://pt-tasks.web.app/?task=901",
        inboxElementId: 42,
        inboxName: "WorkInbox",
        alreadyExisted: false,
      });

    const { persistCurrentAst } = mountPopovers({
      editor,
      page: { pageId: 842, journalId: 15, subject: "Notatka" },
    });

    act(() => {
      triggerGetTaskAction(editor);
    });
    await flushAsync();

    act(() => {
      findButtonByText(/Wyślij do GetTask3/i).click();
    });
    await flushAsync();

    const retryBtn = findButtonByText(/Ponów wysyłkę/i);
    expect(retryBtn).not.toBeNull();
    const firstClientId = apiService.createGetTaskFromNote.mock.calls[0][0].clientTaskId;
    expect(findGetTaskNodeByClientId(editor, firstClientId)[0].syncStatus).toBe("failed");

    act(() => {
      retryBtn.click();
    });
    await flushAsync();

    expect(apiService.createGetTaskFromNote).toHaveBeenCalledTimes(2);
    expect(persistCurrentAst).toHaveBeenCalledTimes(1);

    const secondClientId = apiService.createGetTaskFromNote.mock.calls[1][0].clientTaskId;
    expect(secondClientId).toBe(firstClientId);
    expect(findGetTaskNodeByClientId(editor, firstClientId)[0].syncStatus).toBe("synced");
    expect(findGetTaskNodeByClientId(editor, firstClientId)[0].getTaskId).toBe(901);
  });

  test("Task View Popover shows GetTask link and unlinks AST node without deleting task", async () => {
    const taskNode = {
      type: ELEMENT_GETTASK_TASK,
      clientTaskId: "cid-view-1",
      getTaskId: 333,
      getTaskUrl: "https://pt-tasks.web.app/?task=333",
      inboxElementId: 42,
      inboxName: "WorkInbox",
      syncStatus: "synced",
      children: [{ text: "Sprawdzić logi" }],
    };
    const editor = createTestEditor([
      { type: "title", children: [{ text: "Notatka" }] },
      { type: "p", children: [{ text: "" }, taskNode, { text: "" }] },
    ]);

    const { persistCurrentAst } = mountPopovers({
      editor,
      page: { pageId: 842, journalId: 15, contentObject: editor.children },
    });

    act(() => {
      notifyGetTaskChipClick(editor, taskNode, { top: 100, bottom: 120, left: 100 });
    });
    await flushAsync();

    const link = findLinkByText(/Otwórz w GetTask3/i);
    expect(link).not.toBeNull();
    expect(link.getAttribute("href")).toBe("https://pt-tasks.web.app/?task=333");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");

    const unlinkBtn = findButtonByText(/Odepnij z notatki/i);
    expect(unlinkBtn).not.toBeNull();
    act(() => {
      unlinkBtn.click();
    });
    await flushAsync();

    expect(persistCurrentAst).toHaveBeenCalledTimes(1);
    expect(findGetTaskNodeByClientId(editor, "cid-view-1")).toBeNull();
    expect(Editor.string(editor, [1])).toBe("Sprawdzić logi");
  });
});
