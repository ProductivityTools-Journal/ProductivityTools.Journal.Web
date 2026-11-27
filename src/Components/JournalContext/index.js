import { createContext, useState, useMemo, useCallback } from "react";

export const SENTINEL_ROOT_ID = 1;

export function isKorzenNode(node) {
  if (!node || node.id == null) return false;
  const id = Number(node.id);
  const parentId = node.parentId != null ? Number(node.parentId) : null;
  return id !== SENTINEL_ROOT_ID && parentId === SENTINEL_ROOT_ID;
}

export function buildNodeMap(journalTree) {
  const map = new Map();
  if (!journalTree) return map;

  const traverse = (node) => {
    if (!node || node.id == null) return;
    if (Array.isArray(node)) {
      for (const n of node) {
        traverse(n);
      }
      return;
    }

    const id = Number(node.id);
    const parentId = node.parentId != null ? Number(node.parentId) : null;
    const rawInboxId =
      node.getTaskInboxElementId ?? node.GetTaskInboxElementId ?? null;
    const rawInboxName =
      node.getTaskInboxName ?? node.GetTaskInboxName ?? null;

    map.set(id, {
      id,
      name: node.name,
      parentId,
      getTaskInboxElementId:
        rawInboxId != null && rawInboxId !== "" ? Number(rawInboxId) : null,
      getTaskInboxName: rawInboxName || null,
    });

    if (node.nodes && Array.isArray(node.nodes)) {
      for (const child of node.nodes) {
        traverse(child);
      }
    }
  };

  traverse(journalTree);
  return map;
}

export function resolveGetTaskInboxFromMap(nodeMap, journalId) {
  if (journalId == null || !nodeMap || nodeMap.size === 0) return null;
  const startId = Number(journalId);
  if (Number.isNaN(startId) || startId === SENTINEL_ROOT_ID) return null;

  let current = nodeMap.get(startId);
  const visited = new Set();

  while (current && !visited.has(current.id)) {
    if (current.id === SENTINEL_ROOT_ID) {
      break;
    }
    visited.add(current.id);

    if (current.getTaskInboxElementId != null) {
      return {
        getTaskInboxElementId: Number(current.getTaskInboxElementId),
        getTaskInboxName: current.getTaskInboxName || "",
        sourceJournalId: current.id,
        sourceJournalName: current.name || "",
        inherited: current.id !== startId,
      };
    }

    if (
      current.parentId == null ||
      current.parentId === current.id ||
      current.parentId === SENTINEL_ROOT_ID
    ) {
      break;
    }
    current = nodeMap.get(current.parentId);
  }

  return null;
}

export function findKorzenFromMap(nodeMap, journalId) {
  if (journalId == null || !nodeMap || nodeMap.size === 0) return null;
  const startId = Number(journalId);
  if (Number.isNaN(startId) || startId === SENTINEL_ROOT_ID) return null;

  let current = nodeMap.get(startId);
  const visited = new Set();

  while (current && !visited.has(current.id)) {
    if (current.id === SENTINEL_ROOT_ID) {
      return null;
    }
    visited.add(current.id);

    if (current.parentId === SENTINEL_ROOT_ID) {
      return current;
    }
    if (current.parentId == null || current.parentId === current.id) {
      return current;
    }
    current = nodeMap.get(current.parentId);
  }

  return null;
}

function cloneAndPatchTreeGetTaskInbox(node, targetId, inboxElementId, inboxName) {
  if (!node) return node;
  if (Array.isArray(node)) {
    return node.map((item) =>
      cloneAndPatchTreeGetTaskInbox(item, targetId, inboxElementId, inboxName)
    );
  }

  const isTarget = Number(node.id) === Number(targetId);
  const nextChildren = Array.isArray(node.nodes)
    ? node.nodes.map((child) =>
        cloneAndPatchTreeGetTaskInbox(child, targetId, inboxElementId, inboxName)
      )
    : node.nodes;

  if (isTarget) {
    return {
      ...node,
      getTaskInboxElementId: inboxElementId != null ? Number(inboxElementId) : null,
      getTaskInboxName: inboxName || null,
      nodes: nextChildren,
    };
  }

  return {
    ...node,
    nodes: nextChildren,
  };
}

export const JournalTreeContext = createContext({
  journalTree: null,
  setJournalTree: () => {},
  findPath: () => "",
  resolveGetTaskInbox: () => null,
  findKorzen: () => null,
  updateNodeGetTaskInbox: () => {},
  treeRefreshVersion: 0,
  requestTreeRefresh: () => {},
  debug: false,
  setDebug: () => {},
});

export function JournalTreeContextProvider({
  children,
  debug: debugProp,
  setDebug: setDebugProp,
}) {
  const [journalTree, setJournalTree] = useState(null);
  const [internalDebug, setInternalDebug] = useState(false);
  const [treeRefreshVersion, setTreeRefreshVersion] = useState(0);

  const debug = debugProp !== undefined ? debugProp : internalDebug;
  const setDebug = setDebugProp !== undefined ? setDebugProp : setInternalDebug;

  // Build flat lookup Map for O(1) node lookup and O(depth) path/inbox resolution
  const nodeMap = useMemo(() => buildNodeMap(journalTree), [journalTree]);

  const findPath = useCallback(
    (id) => {
      if (id == null) return "";
      const numId = Number(id);
      if (!nodeMap.has(numId)) return "";
      const pathParts = [];
      let current = nodeMap.get(numId);
      const visited = new Set();

      while (current && current.id !== current.parentId && !visited.has(current.id)) {
        visited.add(current.id);
        pathParts.unshift(current.name);
        if (current.parentId == null || current.parentId === current.id) break;
        current = nodeMap.get(current.parentId);
      }

      return pathParts.join(">>");
    },
    [nodeMap]
  );

  const resolveGetTaskInbox = useCallback(
    (journalId) => resolveGetTaskInboxFromMap(nodeMap, journalId),
    [nodeMap]
  );

  const findKorzen = useCallback(
    (journalId) => findKorzenFromMap(nodeMap, journalId),
    [nodeMap]
  );

  const requestTreeRefresh = useCallback(() => {
    setTreeRefreshVersion((v) => v + 1);
  }, []);

  const updateNodeGetTaskInbox = useCallback(
    (journalId, inboxElementId, inboxName) => {
      setJournalTree((prev) =>
        cloneAndPatchTreeGetTaskInbox(prev, journalId, inboxElementId, inboxName)
      );
      setTreeRefreshVersion((v) => v + 1);
    },
    []
  );

  const value = useMemo(
    () => ({
      journalTree,
      setJournalTree,
      findPath,
      resolveGetTaskInbox,
      findKorzen,
      updateNodeGetTaskInbox,
      treeRefreshVersion,
      requestTreeRefresh,
      debug,
      setDebug,
    }),
    [
      journalTree,
      findPath,
      resolveGetTaskInbox,
      findKorzen,
      updateNodeGetTaskInbox,
      treeRefreshVersion,
      requestTreeRefresh,
      debug,
      setDebug,
    ]
  );

  return (
    <JournalTreeContext.Provider value={value}>
      {children}
    </JournalTreeContext.Provider>
  );
}
