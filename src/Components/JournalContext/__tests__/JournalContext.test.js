import {
  SENTINEL_ROOT_ID,
  isKorzenNode,
  buildNodeMap,
  resolveGetTaskInboxFromMap,
  findKorzenFromMap,
} from "../index";

describe("JournalContext GetTask inbox resolution", () => {
  const sampleTree = {
    id: SENTINEL_ROOT_ID,
    parentId: null,
    name: "Root",
    // Sentinel root must never be used as a fallback even if populated
    getTaskInboxElementId: 999,
    getTaskInboxName: "SentinelShouldBeIgnored",
    nodes: [
      {
        id: 10,
        parentId: 1,
        name: "Praca",
        inboxName: "JournalQuickCapture",
        getTaskInboxElementId: 42,
        getTaskInboxName: "WorkInbox",
        nodes: [
          {
            id: 15,
            parentId: 10,
            name: "Projekt A",
            nodes: [
              {
                id: 22,
                parentId: 15,
                name: "Spotkania",
                nodes: [],
              },
            ],
          },
        ],
      },
      {
        id: 20,
        parentId: 1,
        name: "Dom",
        // No GetTask inbox configured
        nodes: [
          {
            id: 25,
            parentId: 20,
            name: "Zakupy",
            nodes: [],
          },
        ],
      },
      {
        id: 30,
        parentId: 1,
        name: "PascalCaseRoot",
        GetTaskInboxElementId: 77,
        GetTaskInboxName: "PascalInbox",
        nodes: [],
      },
    ],
  };

  test("isKorzenNode identifies only direct children of sentinel Root id === 1", () => {
    expect(isKorzenNode({ id: 1, parentId: null })).toBe(false);
    expect(isKorzenNode({ id: 1, parentId: 1 })).toBe(false);
    expect(isKorzenNode({ id: 10, parentId: 1 })).toBe(true);
    expect(isKorzenNode({ id: 15, parentId: 10 })).toBe(false);
    expect(isKorzenNode(null)).toBe(false);
  });

  test("resolveGetTaskInboxFromMap resolves directly on a Korzeń (not inherited)", () => {
    const map = buildNodeMap(sampleTree);
    expect(resolveGetTaskInboxFromMap(map, 10)).toEqual({
      getTaskInboxElementId: 42,
      getTaskInboxName: "WorkInbox",
      sourceJournalId: 10,
      sourceJournalName: "Praca",
      inherited: false,
    });
  });

  test("resolveGetTaskInboxFromMap inherits from ancestor Korzeń for nested folders", () => {
    const map = buildNodeMap(sampleTree);
    expect(resolveGetTaskInboxFromMap(map, 22)).toEqual({
      getTaskInboxElementId: 42,
      getTaskInboxName: "WorkInbox",
      sourceJournalId: 10,
      sourceJournalName: "Praca",
      inherited: true,
    });
  });

  test("resolveGetTaskInboxFromMap stops before sentinel Root id === 1", () => {
    const map = buildNodeMap(sampleTree);
    expect(resolveGetTaskInboxFromMap(map, 25)).toBeNull();
    expect(resolveGetTaskInboxFromMap(map, 20)).toBeNull();
    expect(resolveGetTaskInboxFromMap(map, 1)).toBeNull();
  });

  test("buildNodeMap supports PascalCase GetTask fields and does not collide with Journal inboxName", () => {
    const map = buildNodeMap(sampleTree);
    expect(resolveGetTaskInboxFromMap(map, 30)).toEqual({
      getTaskInboxElementId: 77,
      getTaskInboxName: "PascalInbox",
      sourceJournalId: 30,
      sourceJournalName: "PascalCaseRoot",
      inherited: false,
    });
    expect(resolveGetTaskInboxFromMap(map, 10).getTaskInboxName).toBe("WorkInbox");
  });

  test("findKorzenFromMap returns the Korzeń ancestor for nested nodes and null for sentinel", () => {
    const map = buildNodeMap(sampleTree);
    expect(findKorzenFromMap(map, 22)?.id).toBe(10);
    expect(findKorzenFromMap(map, 10)?.id).toBe(10);
    expect(findKorzenFromMap(map, 25)?.id).toBe(20);
    expect(findKorzenFromMap(map, 1)).toBeNull();
  });
});
