import { createContext, useEffect, useContext, useState } from "react";

export const JournalTreeContext = createContext({
  journalTree: "pawel",
  setJournalTree: () => {},
});

export function JournalTreeContextProvider({ children }) {
  const [journalTree, setJournalTree] = useState(null);

  const findRecurency = (id, node) => {
    console.log(node);
    if (node.id == id) {
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
    while (nodeInJournalTree != null) {
      path = nodeInJournalTree.name + ">>" + path;
      nodeInJournalTree = nodeInJournalTree.parent;
    }
    return path.trim(">>");
  };

  const value = { journalTree, setJournalTree, findPath };

  return <JournalTreeContext.Provider value={value}>{children}</JournalTreeContext.Provider>;
}
