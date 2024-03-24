import { createContext, useEffect, useContext, useState } from "react";

export const JournalTreeContext = createContext({
  journalTree: "pawel",
  setJournalTree: () => {},
});

export function JournalTreeContextProvider({ children }) {
  const [journalTree, setJournalTree] = useState(null);

  const findRecurency = (id, node) => {
    console.log(node);
    if (node.id == id || node.id == node.parentId) {
      return node;
    } else {
      for (const n of node?.nodes) {
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

  const value = { journalTree, setJournalTree, findPath };

  return <JournalTreeContext.Provider value={value}>{children}</JournalTreeContext.Provider>;
}
