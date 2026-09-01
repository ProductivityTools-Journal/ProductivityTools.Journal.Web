import { createContext, useState, useMemo, useCallback } from "react";

export const JournalTreeContext = createContext({
  journalTree: null,
  setJournalTree: () => {},
  findPath: () => "",
  debug: false,
  setDebug: () => {},
});

export function JournalTreeContextProvider({ children, debug: debugProp, setDebug: setDebugProp }) {
  const [journalTree, setJournalTree] = useState(null);
  const [internalDebug, setInternalDebug] = useState(false);

  const debug = debugProp !== undefined ? debugProp : internalDebug;
  const setDebug = setDebugProp !== undefined ? setDebugProp : setInternalDebug;

  // Build flat lookup Map for O(1) node lookup and O(depth) path reconstruction
  const nodeMap = useMemo(() => {
    const map = new Map();
    if (!journalTree) return map;

    const traverse = (node) => {
      if (!node) return;
      if (Array.isArray(node)) {
        for (const n of node) {
          traverse(n);
        }
        return;
      }
      map.set(node.id, { id: node.id, name: node.name, parentId: node.parentId });
      if (node.nodes && Array.isArray(node.nodes)) {
        for (const child of node.nodes) {
          traverse(child);
        }
      }
    };

    traverse(journalTree);
    return map;
  }, [journalTree]);

  const findPath = useCallback(
    (id) => {
      if (!id || !nodeMap.has(id)) return "";
      const pathParts = [];
      let current = nodeMap.get(id);
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

  const value = useMemo(
    () => ({ journalTree, setJournalTree, findPath, debug, setDebug }),
    [journalTree, findPath, debug, setDebug]
  );

  return <JournalTreeContext.Provider value={value}>{children}</JournalTreeContext.Provider>;
}
