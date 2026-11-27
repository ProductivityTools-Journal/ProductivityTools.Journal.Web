import React, { act } from "react";
import { createRoot } from "react-dom/client";

jest.mock("services/apiService", () => ({
  fetchPageList: jest.fn(),
  fetchMeeting: jest.fn(),
  syncSubtreeForOffline: jest.fn(),
}));

jest.mock("services/offlineService", () => ({
  __esModule: true,
  default: {
    onDataRefreshed: jest.fn(() => () => {}),
    getState: jest.fn(() => ({ syncedNodes: {} })),
    subscribe: jest.fn(() => () => {}),
  },
}));

jest.mock("Components/Page", () => ({
  __esModule: true,
  default: ({ page, isHighlighted }) => (
    <div
      id={`journal-page-${page.pageId}`}
      data-testid={`mock-page-${page.pageId}`}
      data-highlighted={String(Boolean(isHighlighted))}
    >
      {page.subject}
    </div>
  ),
}));

import * as apiService from "services/apiService";
import PageList from "../index";

async function flushAsync() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("PageList deep-link fallback", () => {
  let container;
  let root;

  beforeEach(() => {
    jest.clearAllMocks();
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

  test("falls back to POST Page/Meeting when highlightedPageId is absent from 50-note list and notifies Main if moved", async () => {
    apiService.fetchPageList.mockResolvedValue([
      {
        pageId: 100,
        journalId: 15,
        subject: "Recent note",
        contentType: "Slate",
        content: JSON.stringify([{ type: "title", children: [{ text: "Recent" }] }]),
      },
    ]);
    apiService.fetchMeeting.mockResolvedValue({
      pageId: 842,
      journalId: 99,
      subject: "Moved old note",
      contentType: "Slate",
      content: JSON.stringify([{ type: "title", children: [{ text: "Moved old note" }] }]),
    });

    const onResolvedDeepLinkPage = jest.fn();

    act(() => {
      root.render(
        <PageList
          selectedTreeNode={{ id: 15, name: "Old Folder" }}
          newPageTrigger={null}
          highlightedPageId={842}
          deepLinkFallbackPage={null}
          onResolvedDeepLinkPage={onResolvedDeepLinkPage}
        />
      );
    });

    await flushAsync();
    await flushAsync();

    expect(apiService.fetchPageList).toHaveBeenCalledWith(15);
    expect(apiService.fetchMeeting).toHaveBeenCalledWith(842);

    const el = container.querySelector('[data-testid="mock-page-842"]');
    expect(el).not.toBeNull();
    expect(el.getAttribute("data-highlighted")).toBe("true");
    expect(onResolvedDeepLinkPage).toHaveBeenCalledWith(
      expect.objectContaining({ pageId: 842, journalId: 99 })
    );
  });

  test("injects deepLinkFallbackPage directly without duplicate fetchMeeting when Main already resolved an archived/moved note", async () => {
    apiService.fetchPageList.mockResolvedValue([]);

    const fallbackNote = {
      pageId: 910,
      journalId: 77,
      subject: "Archived folder note",
      contentType: "Slate",
      content: JSON.stringify([{ type: "title", children: [{ text: "Archived" }] }]),
    };

    act(() => {
      root.render(
        <PageList
          selectedTreeNode={{ id: 77, name: "Archived Folder", archived: true }}
          newPageTrigger={null}
          highlightedPageId={910}
          deepLinkFallbackPage={fallbackNote}
          onResolvedDeepLinkPage={jest.fn()}
        />
      );
    });

    await flushAsync();
    await flushAsync();

    expect(apiService.fetchMeeting).not.toHaveBeenCalled();
    const el = container.querySelector('[data-testid="mock-page-910"]');
    expect(el).not.toBeNull();
    expect(el.getAttribute("data-highlighted")).toBe("true");
  });
});
