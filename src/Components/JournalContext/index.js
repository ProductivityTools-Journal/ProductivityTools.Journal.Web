import { createContext, useState } from "react";

export const JournalTreeContext = createContext({
  journalTree: "pawel",
  setJournalTree: () => {},
  findPath: () => {},
  debug: false,
  setDebug: () => {},
});

export function JournalTreeContextProvider({ children, debug: debugProp, setDebug: setDebugProp }) {
  const [journalTree, setJournalTree] = useState(null);
  const [internalDebug, setInternalDebug] = useState(false);

  const debug = debugProp !== undefined ? debugProp : internalDebug;
  const setDebug = setDebugProp !== undefined ? setDebugProp : setInternalDebug;

  const findRecurency = (id, node) => {
    //console.log(node);
    if (!node) return undefined;
    if (node.id == id || node.id == node.parentId) {
      return node;
    } else if (node.nodes && Array.isArray(node.nodes)) {
      for (const n of node.nodes) {
        var r = findRecurency(id, n);
        if (r != undefined) {
          return r;
        }
      }
    }
  };

  const findPath = (id) => {
    console.log(journalTree);
    
    let nodeInJournalTree = findRecurency(id, journalTree);
    console.log(nodeInJournalTree);
    var path = "";
    while (nodeInJournalTree != null && nodeInJournalTree.id != nodeInJournalTree.parentId) {
      path = nodeInJournalTree.name + ">>" + path;
      nodeInJournalTree = findRecurency(nodeInJournalTree.parentId, journalTree);
    }
    return path.slice(0, path.length - 2);
  };

  const value = { journalTree, setJournalTree, findPath, debug, setDebug };

  return <JournalTreeContext.Provider value={value}>{children}</JournalTreeContext.Provider>;
}
