import React from "react";
import { Editor, Element, Path, Range, Transforms } from "slate";
import { createPluginFactory } from "@udecode/plate";
import { v4 as uuid } from "uuid";
import * as Common from "../Common.js";

export const ELEMENT_GETTASK_TASK = "gettask_task";
export const DEFAULT_GETTASK_WEB_BASE_URL = "https://pt-tasks.web.app";

const triggerListeners = new Set();
const chipClickListeners = new Set();

export function subscribeGetTaskTrigger(listener) {
  triggerListeners.add(listener);
  return () => triggerListeners.delete(listener);
}

export function triggerGetTaskAction(editor) {
  triggerListeners.forEach((listener) => listener(editor));
}

export function subscribeGetTaskChipClick(listener) {
  chipClickListeners.add(listener);
  return () => chipClickListeners.delete(listener);
}

export function notifyGetTaskChipClick(editor, element, rect) {
  chipClickListeners.forEach((listener) => listener(editor, element, rect));
}

export function generateClientTaskId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return uuid();
}

export function getGetTaskUrl(element) {
  if (!element) return null;
  if (element.getTaskUrl) {
    return element.getTaskUrl;
  }
  if (element.getTaskId != null) {
    return `${DEFAULT_GETTASK_WEB_BASE_URL}/?task=${element.getTaskId}`;
  }
  return null;
}

export function getSelectionCoords() {
  if (typeof window === "undefined") return { top: 140, left: 160 };
  const domSelection = window.getSelection();
  if (domSelection && domSelection.rangeCount > 0) {
    const range = domSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (
      rect &&
      (rect.top !== 0 || rect.left !== 0 || rect.width !== 0 || rect.height !== 0)
    ) {
      return {
        top: Math.min(Math.max(rect.bottom + 8, 16), Math.max(16, window.innerHeight - 360)),
        left: Math.min(Math.max(rect.left, 12), Math.max(12, window.innerWidth - 380)),
      };
    }
    const container =
      range.startContainer?.nodeType === 1
        ? range.startContainer
        : range.startContainer?.parentElement;
    if (container && container.getBoundingClientRect) {
      const cRect = container.getBoundingClientRect();
      return {
        top: Math.min(Math.max(cRect.bottom + 8, 16), Math.max(16, window.innerHeight - 360)),
        left: Math.min(Math.max(cRect.left, 12), Math.max(12, window.innerWidth - 380)),
      };
    }
  }
  return { top: 140, left: 160 };
}

export function clampPopoverCoords(rect, width = 360, height = 280) {
  if (typeof window === "undefined" || !rect) {
    return { top: 140, left: 160 };
  }
  return {
    top: Math.min(Math.max((rect.bottom ?? rect.top ?? 120) + 8, 16), Math.max(16, window.innerHeight - height)),
    left: Math.min(Math.max(rect.left ?? 160, 12), Math.max(12, window.innerWidth - width)),
  };
}

export function splitSelectionTextToTitleAndDetails(rawText, maxTitleLen = 200) {
  const normalized = String(rawText || "").replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return { title: "", detailsText: "" };
  }

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { title: "", detailsText: "" };
  }

  let title = lines[0];
  const restLines = lines.slice(1);

  if (title.length > maxTitleLen) {
    let splitIdx = title.lastIndexOf(" ", maxTitleLen);
    if (splitIdx < Math.floor(maxTitleLen * 0.5)) {
      splitIdx = maxTitleLen;
    }
    const overflow = title.slice(splitIdx).trim();
    title = title.slice(0, splitIdx).trim();
    if (overflow) {
      restLines.unshift(overflow);
    }
  }

  return {
    title,
    detailsText: restLines.join("\n").trim(),
  };
}

export function getSelectedPlainTextWithNewlines(editor, selection = editor?.selection) {
  if (!editor || !selection || Range.isCollapsed(selection)) {
    return "";
  }
  try {
    const fragment = Editor.fragment(editor, selection);
    const plain = Common.getPlainTextFromSlateStructure(fragment);
    if (plain) return plain;
  } catch (_err) {
    // Fallback to Editor.string below
  }
  try {
    return Editor.string(editor, selection);
  } catch (_err) {
    return "";
  }
}

export function findGetTaskNodeAtSelection(editor, selection = editor?.selection) {
  if (!editor || !selection) return null;
  try {
    const [match] = Editor.nodes(editor, {
      at: selection,
      match: (n) => Element.isElement(n) && n.type === ELEMENT_GETTASK_TASK,
      mode: "lowest",
    });
    return match || null;
  } catch (_err) {
    return null;
  }
}

export function findGetTaskNodeByClientId(editor, clientTaskId) {
  if (!editor || !clientTaskId) return null;
  try {
    const [match] = Editor.nodes(editor, {
      at: [],
      match: (n) =>
        Element.isElement(n) &&
        n.type === ELEMENT_GETTASK_TASK &&
        n.clientTaskId === clientTaskId,
    });
    return match || null;
  } catch (_err) {
    return null;
  }
}

/**
 * Resolves a single-block target Range so wrapping in an inline `gettask_task`
 * element never violates Slate's inline element invariants on multi-block selections.
 */
export function getSingleBlockTargetRange(editor, selection) {
  if (!editor || !selection || Range.isCollapsed(selection)) {
    return null;
  }

  const [start, end] = Range.edges(selection);

  const startBlockEntry = Editor.above(editor, {
    at: start,
    match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
    mode: "lowest",
  });
  const endBlockEntry = Editor.above(editor, {
    at: end,
    match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
    mode: "lowest",
  });

  if (!startBlockEntry) {
    return { anchor: start, focus: end };
  }

  const [, startBlockPath] = startBlockEntry;
  const endBlockPath = endBlockEntry ? endBlockEntry[1] : null;

  if (endBlockPath && Path.equals(startBlockPath, endBlockPath)) {
    return { anchor: start, focus: end };
  }

  // Multi-block selection: constrain inline wrap to the selected slice of the first non-empty block
  const firstBlockEnd = Editor.end(editor, startBlockPath);
  const firstSlice = { anchor: start, focus: firstBlockEnd };
  if (!Range.isCollapsed(firstSlice) && Editor.string(editor, firstSlice).trim().length > 0) {
    return firstSlice;
  }

  // If the first block's selected slice was empty (e.g. selection started at end of line),
  // advance to the first block within the selection that contains non-empty selected text.
  const blockEntries = Array.from(
    Editor.nodes(editor, {
      at: selection,
      match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
      mode: "lowest",
    })
  );

  for (const [, blockPath] of blockEntries) {
    const blockRange = Editor.range(editor, blockPath);
    const intersection = Range.intersection(selection, blockRange);
    if (
      intersection &&
      !Range.isCollapsed(intersection) &&
      Editor.string(editor, intersection).trim().length > 0
    ) {
      return intersection;
    }
  }

  return firstSlice;
}

export function wrapSelectionWithGetTask(editor, selection, taskProps) {
  if (!editor || !selection) return false;
  const targetRange = getSingleBlockTargetRange(editor, selection);
  if (!targetRange || Range.isCollapsed(targetRange)) {
    return false;
  }

  const nodeToWrap = {
    type: ELEMENT_GETTASK_TASK,
    clientTaskId: taskProps.clientTaskId,
    getTaskId: taskProps.getTaskId ?? null,
    getTaskUrl: taskProps.getTaskUrl ?? null,
    inboxElementId: taskProps.inboxElementId ?? null,
    inboxName: taskProps.inboxName ?? "",
    syncStatus: taskProps.syncStatus || "pending",
    children: [],
  };

  Transforms.wrapNodes(editor, nodeToWrap, {
    at: targetRange,
    split: true,
  });

  const wrappedEntry = findGetTaskNodeByClientId(editor, taskProps.clientTaskId);
  if (wrappedEntry) {
    const [, wrappedPath] = wrappedEntry;
    const afterPoint = Editor.after(editor, wrappedPath);
    if (afterPoint) {
      Transforms.select(editor, afterPoint);
    } else {
      Transforms.collapse(editor, { edge: "end" });
    }
  }
  return true;
}

export function patchGetTaskNode(editor, clientTaskId, patch) {
  const entry = findGetTaskNodeByClientId(editor, clientTaskId);
  if (!entry) return false;
  const [, path] = entry;
  Transforms.setNodes(editor, patch, { at: path });
  return true;
}

export function unwrapGetTaskNode(editor, clientTaskId) {
  const entry = findGetTaskNodeByClientId(editor, clientTaskId);
  if (!entry) return false;
  const [, path] = entry;
  Transforms.unwrapNodes(editor, {
    at: path,
    match: (n) => Element.isElement(n) && n.type === ELEMENT_GETTASK_TASK,
  });
  return true;
}

/**
 * Pure AST unwrapper used when unlinking a task in readonly mode (or without live transforms).
 */
export function unwrapGetTaskInAst(nodes, clientTaskId) {
  if (!Array.isArray(nodes)) return nodes;
  let changed = false;

  const transformChildren = (children) => {
    const next = [];
    for (const child of children) {
      if (
        child &&
        typeof child === "object" &&
        child.type === ELEMENT_GETTASK_TASK &&
        child.clientTaskId === clientTaskId
      ) {
        changed = true;
        if (Array.isArray(child.children)) {
          next.push(...child.children);
        }
      } else if (child && typeof child === "object" && Array.isArray(child.children)) {
        next.push({
          ...child,
          children: transformChildren(child.children),
        });
      } else {
        next.push(child);
      }
    }
    return next;
  };

  const result = transformChildren(nodes);
  return changed ? result : nodes;
}

/**
 * Pure AST patcher used when retrying a failed task directly from readonly mode.
 */
export function patchGetTaskInAst(nodes, clientTaskId, patch) {
  if (!Array.isArray(nodes)) return nodes;
  let changed = false;

  const transformChildren = (children) =>
    children.map((child) => {
      if (
        child &&
        typeof child === "object" &&
        child.type === ELEMENT_GETTASK_TASK &&
        child.clientTaskId === clientTaskId
      ) {
        changed = true;
        return { ...child, ...patch };
      }
      if (child && typeof child === "object" && Array.isArray(child.children)) {
        return { ...child, children: transformChildren(child.children) };
      }
      return child;
    });

  const result = transformChildren(nodes);
  return changed ? result : nodes;
}

export const createGetTaskPlugin = createPluginFactory({
  key: ELEMENT_GETTASK_TASK,
  isElement: true,
  isInline: true,
  handlers: {
    onKeyDown: (editor) => (e) => {
      if (e.defaultPrevented) return;
      const lower = (e.key || "").toLowerCase();
      const isCtrlShiftT =
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        !e.altKey &&
        (lower === "t" || e.code === "KeyT");
      if (isCtrlShiftT) {
        e.preventDefault();
        e.stopPropagation();
        triggerGetTaskAction(editor);
      }
    },
  },
});

export function GetTaskElement(props) {
  const { attributes, children, element, editor } = props;
  const syncStatus =
    element?.syncStatus || (element?.getTaskId != null ? "synced" : "pending");
  const inboxLabel =
    element?.inboxName ||
    (element?.inboxElementId != null ? `#${element.inboxElementId}` : "GetTask");

  const statusSymbol =
    syncStatus === "synced" ? "✓" : syncStatus === "failed" ? "!" : "…";
  const statusTitle =
    syncStatus === "synced"
      ? `Wysłano do GetTask3 (${inboxLabel}) — kliknij, aby otworzyć lub odpiąć`
      : syncStatus === "failed"
      ? `Błąd wysyłania do GetTask3 (${inboxLabel}) — kliknij, aby ponowić`
      : `Wysyłanie do GetTask3 (${inboxLabel})...`;

  const handleChipClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    notifyGetTaskChipClick(editor, element, rect);
  };

  return (
    <span
      {...attributes}
      className={`journal-gettask-inline journal-gettask-inline--${syncStatus}`}
      data-gettask-client-id={element?.clientTaskId || ""}
      data-gettask-id={element?.getTaskId ?? ""}
      data-gettask-status={syncStatus}
    >
      {children}
      <span
        contentEditable={false}
        role="button"
        tabIndex={0}
        title={statusTitle}
        className={`journal-gettask-chip journal-gettask-chip--${syncStatus}`}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={handleChipClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleChipClick(e);
          }
        }}
      >
        <span className="journal-gettask-chip__icon" aria-hidden="true">
          {statusSymbol}
        </span>
        <span className="journal-gettask-chip__label">{inboxLabel}</span>
      </span>
    </span>
  );
}
