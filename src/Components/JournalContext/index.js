import { createContext, useEffect, useContext, useState } from "react";

export const JournalTreeContext = createContext({
  journalTree: "pawel",
  setJournalTree: () => {},
});

export function JournalTreeContextProvider({ children }) {
  const [journalTree, setJournalTree] = useState('marcin');

  const value = { journalTree, setJournalTree };

  return <JournalTreeContext.Provider value={value}>{children}</JournalTreeContext.Provider>;
}
