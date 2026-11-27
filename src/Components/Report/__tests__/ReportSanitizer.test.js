jest.mock("react-router-dom", () => ({
  useParams: () => ({}),
  Link: ({ children }) => children,
}), { virtual: true });

jest.mock("services/apiService", () => ({
  getPublicTreeNotes: jest.fn(),
}));

import {
  sanitizeSlateDocument,
  sanitizeSlateElement,
  sanitizeSlateChild,
} from "../index";

describe("Report public AST sanitizer for gettask_task", () => {
  test("flattens inline gettask_task elements into plain text leaves and strips all GetTask metadata", () => {
    const input = [
      { type: "title", children: [{ text: "Notatka ze spotkania" }] },
      {
        type: "p",
        children: [
          { text: "Proszę " },
          {
            type: "gettask_task",
            clientTaskId: "11111111-2222-3333-4444-555555555555",
            getTaskId: 9876,
            getTaskUrl: "https://pt-tasks.web.app/?task=9876",
            inboxElementId: 42,
            inboxName: "SecretWorkInbox",
            syncStatus: "synced",
            children: [
              { text: "wysłać ", bold: true },
              { text: "raport", color: "#d32f2f" },
            ],
          },
          { text: " przed piątkiem." },
        ],
      },
    ];

    const sanitized = sanitizeSlateDocument(input);
    expect(sanitized).toEqual([
      { type: "title", children: [{ text: "Notatka ze spotkania" }] },
      {
        type: "p",
        children: [
          { text: "Proszę " },
          { text: "wysłać ", bold: true },
          { text: "raport", color: "#d32f2f" },
          { text: " przed piątkiem." },
        ],
      },
    ]);

    const serialized = JSON.stringify(sanitized);
    expect(serialized).not.toContain("gettask_task");
    expect(serialized).not.toContain("9876");
    expect(serialized).not.toContain("SecretWorkInbox");
    expect(serialized).not.toContain("pt-tasks.web.app");
    expect(serialized).not.toContain("11111111-2222-3333-4444-555555555555");
  });

  test("preserves normal <a> links while flattening gettask_task inside nested lists/tables", () => {
    const input = [
      {
        type: "p",
        children: [
          {
            type: "a",
            url: "https://example.com",
            children: [{ text: "Dokumentacja" }],
          },
          { text: " — " },
          {
            type: "gettask_task",
            clientTaskId: "abc",
            getTaskId: 12,
            inboxElementId: 3,
            inboxName: "Inbox",
            syncStatus: "synced",
            children: [{ text: "zaktualizować opis", italic: true }],
          },
        ],
      },
    ];

    const sanitized = sanitizeSlateDocument(input);
    expect(sanitized[0].children).toEqual([
      {
        type: "a",
        url: "https://example.com",
        children: [{ text: "Dokumentacja" }],
      },
      { text: " — " },
      { text: "zaktualizować opis", italic: true },
    ]);
  });

  test("sanitizeSlateElement converts degenerate top-level gettask_task into clean paragraph", () => {
    const result = sanitizeSlateElement({
      type: "gettask_task",
      clientTaskId: "x",
      getTaskId: 5,
      children: [{ text: "Zadanie" }],
    });
    expect(result).toEqual({
      type: "p",
      children: [{ text: "Zadanie" }],
    });
  });

  test("sanitizeSlateChild handles gettask_task directly", () => {
    const result = sanitizeSlateChild({
      type: "gettask_task",
      clientTaskId: "x",
      getTaskId: 5,
      children: [{ text: "Text", underline: true }],
    });
    expect(result).toEqual([{ text: "Text", underline: true }]);
  });
});
