import axios from "axios";
import * as Consts from "Consts";
import { config } from "Consts";
import { auth } from "../Session/firebase";
import { isJwtExpired } from "jwt-check-expiration";
import statusService from "./statusService";
import offlineService from "./offlineService";

function isOfflineOrNetworkError(error) {
  return offlineService.isNetworkError(error);
}

async function getTree(includeArchived = false) {
  console.log("GetTreeInvoked");
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const cached = await offlineService.getTreeCache(includeArchived);
    if (cached) {
      statusService.info("Offline: loaded journal tree from local cache");
      return cached;
    }
  }

  let call = async (header) => {
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_GET}`,
      { includeArchived: Boolean(includeArchived) },
      header
    );
    return response.data;
  };

  try {
    const data = await invokeCallWithToast(call, "Trying to get tree", "Tree returned");
    if (data) {
      await offlineService.saveTreeCache(data, includeArchived);
      offlineService.setOnlineStatus(true);
    }
    return data;
  } catch (error) {
    if (isOfflineOrNetworkError(error)) {
      offlineService.setOnlineStatus(false);
      const cached = await offlineService.getTreeCache(includeArchived);
      if (cached) {
        statusService.warn("Offline mode: using locally cached journal tree");
        return cached;
      }
    }
    throw error;
  }
}

async function addTreeNode(parentId, name) {
  if ((typeof navigator !== "undefined" && !navigator.onLine) || Number(parentId) < 0) {
    const tempId = await offlineService.addTreeNodeOffline(parentId, name);
    statusService.warn(`Offline: folder "${name}" added locally (queued for sync)`);
    return tempId;
  }

  let call = async (header) => {
    const data = { ParentId: Number(parentId), Name: name };
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_ADDITEM}`,
      data,
      header
    );
    return response.data;
  };

  try {
    return await invokeCallWithToast(call, "Adding tree item", "Tree item added");
  } catch (error) {
    if (isOfflineOrNetworkError(error)) {
      offlineService.setOnlineStatus(false);
      const tempId = await offlineService.addTreeNodeOffline(parentId, name);
      statusService.warn(`Offline: folder "${name}" added locally (queued for sync)`);
      return tempId;
    }
    throw error;
  }
}

async function moveTreeNode(sourceId, targetParentId) {
  if (
    (typeof navigator !== "undefined" && !navigator.onLine) ||
    Number(sourceId) < 0 ||
    Number(targetParentId) < 0
  ) {
    await offlineService.moveTreeNodeOffline(sourceId, targetParentId);
    statusService.warn("Offline: folder move saved locally (queued for sync)");
    return true;
  }

  let call = async (header) => {
    const data = { SourceId: Number(sourceId), ParentTargetId: Number(targetParentId) };
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_MOVEITEM}`,
      data,
      header
    );
    return response.data;
  };

  try {
    return await invokeCallWithToast(call, "Moving tree element", "Tree element moved");
  } catch (error) {
    if (isOfflineOrNetworkError(error)) {
      offlineService.setOnlineStatus(false);
      await offlineService.moveTreeNodeOffline(sourceId, targetParentId);
      statusService.warn("Offline: folder move saved locally (queued for sync)");
      return true;
    }
    throw error;
  }
}

async function deleteTree(treeId) {
  if ((typeof navigator !== "undefined" && !navigator.onLine) || Number(treeId) < 0) {
    const res = await offlineService.deleteTreeNodeOffline(treeId);
    statusService.warn("Offline: folder deleted locally (queued for sync)");
    return res;
  }

  let call = async (header) => {
    const data = { TreeId: Number(treeId) };
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_DELETE}`,
      data,
      header
    );
    return response.data;
  };

  try {
    return await invokeCallWithToast(call, "delete tree", "tree deleted");
  } catch (error) {
    if (isOfflineOrNetworkError(error)) {
      offlineService.setOnlineStatus(false);
      const res = await offlineService.deleteTreeNodeOffline(treeId);
      statusService.warn("Offline: folder deleted locally (queued for sync)");
      return res;
    }
    throw error;
  }
}

async function renameJournal(journalId, newName) {
  if ((typeof navigator !== "undefined" && !navigator.onLine) || Number(journalId) < 0) {
    const res = await offlineService.renameTreeNodeOffline(journalId, newName);
    statusService.warn(`Offline: folder renamed to "${newName}" locally (queued for sync)`);
    return res;
  }

  let call = async (header) => {
    const data = { JournalId: Number(journalId), NewName: newName };
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/Rename`,
      data,
      header
    );
    return response.data;
  };

  try {
    return await invokeCallWithToast(call, "renaming", "renamed");
  } catch (error) {
    if (isOfflineOrNetworkError(error)) {
      offlineService.setOnlineStatus(false);
      const res = await offlineService.renameTreeNodeOffline(journalId, newName);
      statusService.warn(`Offline: folder renamed to "${newName}" locally (queued for sync)`);
      return res;
    }
    throw error;
  }
}

async function setInboxName(journalId, inboxName) {
  if ((typeof navigator !== "undefined" && !navigator.onLine) || Number(journalId) < 0) {
    const res = await offlineService.setInboxNameOffline(journalId, inboxName);
    statusService.warn("Offline: inbox name saved locally (queued for sync)");
    return res;
  }

  let call = async (header) => {
    const data = { JournalId: Number(journalId), InboxName: inboxName };
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_SET_INBOX_NAME}`,
      data,
      header
    );
    return response.data;
  };

  try {
    return await invokeCallWithToast(call, "Setting inbox name", "Inbox name set");
  } catch (error) {
    if (isOfflineOrNetworkError(error)) {
      offlineService.setOnlineStatus(false);
      const res = await offlineService.setInboxNameOffline(journalId, inboxName);
      statusService.warn("Offline: inbox name saved locally (queued for sync)");
      return res;
    }
    throw error;
  }
}

async function removeInboxName(journalId) {
  if ((typeof navigator !== "undefined" && !navigator.onLine) || Number(journalId) < 0) {
    const res = await offlineService.removeInboxNameOffline(journalId);
    statusService.warn("Offline: inbox name removed locally (queued for sync)");
    return res;
  }

  let call = async (header) => {
    const data = { Id: Number(journalId) };
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_REMOVE_INBOX_NAME}`,
      data,
      header
    );
    return response.data;
  };

  try {
    return await invokeCallWithToast(call, "Removing inbox name", "Inbox name removed");
  } catch (error) {
    if (isOfflineOrNetworkError(error)) {
      offlineService.setOnlineStatus(false);
      const res = await offlineService.removeInboxNameOffline(journalId);
      statusService.warn("Offline: inbox name removed locally (queued for sync)");
      return res;
    }
    throw error;
  }
}

async function archiveJournal(journalId, archived = true) {
  if ((typeof navigator !== "undefined" && !navigator.onLine) || Number(journalId) < 0) {
    const res = await offlineService.archiveTreeNodeOffline(journalId, archived);
    statusService.warn("Offline: archive state updated locally (queued for sync)");
    return res;
  }

  let call = async (header) => {
    const data = { JournalId: Number(journalId), Archived: Boolean(archived) };
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_ARCHIVE}`,
      data,
      header
    );
    return response.data;
  };

  try {
    return await invokeCallWithToast(
      call,
      archived ? "Archiving journal" : "Unarchiving journal",
      archived ? "Journal archived" : "Journal unarchived"
    );
  } catch (error) {
    if (isOfflineOrNetworkError(error)) {
      offlineService.setOnlineStatus(false);
      const res = await offlineService.archiveTreeNodeOffline(journalId, archived);
      statusService.warn("Offline: archive state updated locally (queued for sync)");
      return res;
    }
    throw error;
  }
}

async function unarchiveJournal(journalId) {
  if ((typeof navigator !== "undefined" && !navigator.onLine) || Number(journalId) < 0) {
    const res = await offlineService.archiveTreeNodeOffline(journalId, false);
    statusService.warn("Offline: unarchived locally (queued for sync)");
    return res;
  }

  let call = async (header) => {
    const data = { JournalId: Number(journalId) };
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_UNARCHIVE}`,
      data,
      header
    );
    return response.data;
  };

  try {
    return await invokeCallWithToast(call, "Unarchiving journal", "Journal unarchived");
  } catch (error) {
    if (isOfflineOrNetworkError(error)) {
      offlineService.setOnlineStatus(false);
      const res = await offlineService.archiveTreeNodeOffline(journalId, false);
      statusService.warn("Offline: unarchived locally (queued for sync)");
      return res;
    }
    throw error;
  }
}

async function savePage(page) {
  if (
    (typeof navigator !== "undefined" && !navigator.onLine) ||
    Number(page.journalId) < 0 ||
    (page.pageId != null && Number(page.pageId) < 0)
  ) {
    const offlineSaved = await offlineService.savePageOffline(page);
    statusService.warn("Offline: new note saved locally (queued for sync)");
    return offlineSaved;
  }

  let call = async (header) => {
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETING_NEW_MEETING}`,
      page,
      header
    );
    return response.data;
  };

  try {
    const saved = await invokeCallWithToast(
      call,
      "Creating new Journal Item",
      "New Journal Item created"
    );
    if (saved && saved.pageId != null) {
      await offlineService.replaceTempPageWithServerPage(saved.pageId, saved);
    }
    return saved;
  } catch (error) {
    if (isOfflineOrNetworkError(error)) {
      offlineService.setOnlineStatus(false);
      const offlineSaved = await offlineService.savePageOffline(page);
      statusService.warn("Offline: new note saved locally (queued for sync)");
      return offlineSaved;
    }
    throw error;
  }
}

async function fetchMeeting(id) {
  if ((typeof navigator !== "undefined" && !navigator.onLine) || Number(id) < 0) {
    const cached = await offlineService.getCachedPage(id);
    if (cached) {
      return cached;
    }
  }

  let call = async (header) => {
    const data = {
      Id: parseInt(id),
    };
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETING_ACTION}`,
      data,
      header
    );
    return response.data;
  };

  try {
    const page = await invokeCallWithToast(
      call,
      "Trying to get Journal details",
      "Journal details returned"
    );
    if (page && page.pageId != null) {
      await offlineService.replaceTempPageWithServerPage(page.pageId, page);
    }
    return page;
  } catch (error) {
    if (isOfflineOrNetworkError(error)) {
      offlineService.setOnlineStatus(false);
      const cached = await offlineService.getCachedPage(id);
      if (cached) {
        statusService.warn("Offline: loaded note details from local cache");
        return cached;
      }
    }
    throw error;
  }
}

async function updateJournal(meeting) {
  if (
    (typeof navigator !== "undefined" && !navigator.onLine) ||
    Number(meeting.pageId) < 0 ||
    Number(meeting.journalId) < 0
  ) {
    const updated = await offlineService.updatePageOffline(meeting);
    statusService.warn("Offline: note update saved locally (queued for sync)");
    return updated;
  }

  let call = async (header) => {
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETING_UPDATE_MEETING}`,
      meeting,
      header
    );
    return response.data;
  };

  try {
    const res = await invokeCallWithToast(
      call,
      "Updating Journal Item",
      "Journal Item Updated"
    );
    if (meeting && meeting.pageId != null) {
      await offlineService.replaceTempPageWithServerPage(meeting.pageId, {
        ...meeting,
        isOfflinePending: false,
      });
    }
    return res;
  } catch (error) {
    if (isOfflineOrNetworkError(error)) {
      offlineService.setOnlineStatus(false);
      const updated = await offlineService.updatePageOffline(meeting);
      statusService.warn("Offline: note update saved locally (queued for sync)");
      return updated;
    }
    throw error;
  }
}

async function getDate() {
  try {
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETINGS_DATE}`
    );
    return response.data;
  } catch (error) {
    if (isOfflineOrNetworkError(error)) {
      return new Date().toISOString();
    }
    throw error;
  }
}

async function getDate2() {
  try {
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/Date2`
    );
    return response.data;
  } catch (error) {
    if (isOfflineOrNetworkError(error)) {
      return "offline";
    }
    throw error;
  }
}

async function deleteMeeting(journalId) {
  if ((typeof navigator !== "undefined" && !navigator.onLine) || Number(journalId) < 0) {
    await offlineService.deletePageOffline(journalId);
    statusService.warn("Offline: note deletion queued for sync");
    return true;
  }

  let call = async (header) => {
    const data = { Id: journalId };
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETINGS_DELETE}`,
      data,
      header
    );
    return response.data;
  };

  try {
    const res = await invokeCallWithToast(
      call,
      "Deleting Journal Item",
      "Journal Item deleted"
    );
    await offlineService.replaceTempPageWithServerPage(journalId, null);
    return res;
  } catch (error) {
    if (isOfflineOrNetworkError(error)) {
      offlineService.setOnlineStatus(false);
      await offlineService.deletePageOffline(journalId);
      statusService.warn("Offline: note deletion queued for sync");
      return true;
    }
    throw error;
  }
}

async function invokeCallWithToast(call, pendingMessage, successMessage) {
  const pending = pendingMessage || "Processing...";
  const success = successMessage || "Completed";
  const opId = statusService.start(pending);
  try {
    const response = await invokeCall(call);
    statusService.success(opId, success);
    return response;
  } catch (error) {
    console.error("API call error:", error);
    const errText =
      error?.response?.data?.message ||
      (typeof error?.response?.data === "string" ? error?.response?.data : null) ||
      error?.message ||
      "Request failed";
    statusService.error(opId, errText);
    throw error;
  }
}

async function fetchPageList(treeId) {
  if ((typeof navigator !== "undefined" && !navigator.onLine) || Number(treeId) < 0) {
    const cached = await offlineService.getCachedPagesForSubtree(treeId);
    statusService.info(`Offline: loaded ${cached.length} notes from local cache`);
    return cached;
  }

  let call = async (header) => {
    const data = { Id: Number(treeId), DrillDown: true };
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETINGS_ACTION}`,
      data,
      header
    );
    return response.data;
  };

  try {
    const serverPages = await invokeCallWithToast(
      call,
      "Trying to meeting list",
      "Meeting list returned"
    );
    offlineService.setOnlineStatus(true);
    await offlineService.cacheSubtreePages(treeId, serverPages || [], {
      markSynced: true,
    });
    return await offlineService.getCachedPagesForSubtree(treeId);
  } catch (error) {
    if (isOfflineOrNetworkError(error)) {
      offlineService.setOnlineStatus(false);
      const cached = await offlineService.getCachedPagesForSubtree(treeId);
      statusService.warn(`Offline mode: loaded ${cached.length} cached notes`);
      return cached;
    }
    throw error;
  }
}

async function syncPendingChanges() {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    statusService.warn("Cannot sync while offline");
    return false;
  }

  const outbox = await offlineService.getOutbox();
  if (!outbox || outbox.length === 0) {
    return true;
  }

  offlineService.setSyncStatus(true, {
    current: 0,
    total: outbox.length,
    label: "Syncing offline changes...",
  });
  const opId = statusService.start(`Syncing ${outbox.length} offline change(s)...`);

  const nodeIdMap = new Map();
  const pageIdMap = new Map();

  const resolveNodeId = (id) => {
    const num = Number(id);
    return nodeIdMap.has(num) ? nodeIdMap.get(num) : num;
  };

  const resolvePageId = (id) => {
    const num = Number(id);
    return pageIdMap.has(num) ? pageIdMap.get(num) : num;
  };

  try {
    for (let i = 0; i < outbox.length; i++) {
      const item = outbox[i];
      offlineService.setSyncStatus(true, {
        current: i + 1,
        total: outbox.length,
        label: item.description || `Syncing ${item.type}...`,
      });

      await invokeCall(async (header) => {
        switch (item.type) {
          case "ADD_TREE_NODE": {
            const parentId = resolveNodeId(item.payload.ParentId);
            const response = await axios.post(
              `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_ADDITEM}`,
              { ParentId: parentId, Name: item.payload.Name },
              header
            );
            const realNodeId = Number(response.data);
            if (item.payload.tempId != null && !Number.isNaN(realNodeId)) {
              nodeIdMap.set(Number(item.payload.tempId), realNodeId);
            }
            break;
          }
          case "RENAME_TREE_NODE": {
            const journalId = resolveNodeId(item.payload.JournalId);
            await axios.post(
              `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/Rename`,
              { JournalId: journalId, NewName: item.payload.NewName },
              header
            );
            break;
          }
          case "MOVE_TREE_NODE": {
            const sourceId = resolveNodeId(item.payload.SourceId);
            const targetParentId = resolveNodeId(item.payload.ParentTargetId);
            await axios.post(
              `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_MOVEITEM}`,
              { SourceId: sourceId, ParentTargetId: targetParentId },
              header
            );
            break;
          }
          case "DELETE_TREE_NODE": {
            const treeId = resolveNodeId(item.payload.TreeId);
            if (treeId > 0) {
              await axios.post(
                `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_DELETE}`,
                { TreeId: treeId },
                header
              );
            }
            break;
          }
          case "ARCHIVE_TREE_NODE": {
            const journalId = resolveNodeId(item.payload.JournalId);
            await axios.post(
              `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_ARCHIVE}`,
              { JournalId: journalId, Archived: true },
              header
            );
            break;
          }
          case "UNARCHIVE_TREE_NODE": {
            const journalId = resolveNodeId(item.payload.JournalId);
            await axios.post(
              `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_UNARCHIVE}`,
              { JournalId: journalId },
              header
            );
            break;
          }
          case "SET_INBOX_NAME": {
            const journalId = resolveNodeId(item.payload.JournalId);
            await axios.post(
              `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_SET_INBOX_NAME}`,
              { JournalId: journalId, InboxName: item.payload.InboxName },
              header
            );
            break;
          }
          case "REMOVE_INBOX_NAME": {
            const journalId = resolveNodeId(item.payload.Id);
            await axios.post(
              `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_REMOVE_INBOX_NAME}`,
              { Id: journalId },
              header
            );
            break;
          }
          case "SAVE_PAGE": {
            const tempPageId = Number(item.payload.pageId);
            const payloadToSend = {
              ...item.payload,
              pageId: undefined,
              isOfflinePending: undefined,
              journalId: resolveNodeId(item.payload.journalId),
            };
            const response = await axios.post(
              `${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETING_NEW_MEETING}`,
              payloadToSend,
              header
            );
            const savedPage = response.data;
            if (savedPage && savedPage.pageId != null) {
              pageIdMap.set(tempPageId, Number(savedPage.pageId));
              await offlineService.replaceTempPageWithServerPage(tempPageId, savedPage);
            }
            break;
          }
          case "UPDATE_PAGE": {
            const realPageId = resolvePageId(item.payload.pageId);
            const payloadToSend = {
              ...item.payload,
              pageId: realPageId,
              journalId: resolveNodeId(item.payload.journalId),
              isOfflinePending: undefined,
            };
            await axios.post(
              `${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETING_UPDATE_MEETING}`,
              payloadToSend,
              header
            );
            await offlineService.markPageSynced(realPageId);
            break;
          }
          case "DELETE_PAGE": {
            const realPageId = resolvePageId(item.payload.Id);
            if (realPageId > 0) {
              await axios.post(
                `${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETINGS_DELETE}`,
                { Id: realPageId },
                header
              );
            }
            break;
          }
          default:
            break;
        }
      });

      await offlineService.removeOutboxOp(item.opId);
    }

    offlineService.setSyncStatus(false, null);
    statusService.success(opId, `Synced ${outbox.length} offline change(s) to server`);
    offlineService.notifyDataRefreshed();
    return true;
  } catch (error) {
    console.error("Error syncing outbox:", error);
    offlineService.setSyncStatus(false, null);
    statusService.error(opId, "Offline sync interrupted — remaining changes stay queued");
    return false;
  }
}

async function syncSubtreeForOffline(treeId, treeName = "") {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    statusService.warn("Cannot download for offline while disconnected");
    return null;
  }

  const label = treeName ? `"${treeName}"` : `#${treeId}`;
  offlineService.setSyncStatus(true, {
    current: 0,
    total: 1,
    label: `Downloading ${label} for offline...`,
  });

  try {
    await syncPendingChanges();
    const pages = await invokeCallWithToast(
      async (header) => {
        const response = await axios.post(
          `${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETINGS_ACTION}`,
          { Id: Number(treeId), DrillDown: true },
          header
        );
        return response.data;
      },
      `Syncing ${label} for offline...`,
      `Synced ${label} for offline`
    );

    await offlineService.cacheSubtreePages(treeId, pages || [], {
      markSynced: true,
      isFullSync: false,
    });
    offlineService.setSyncStatus(false, null);
    statusService.success(
      `Offline ready: ${label} (${(pages || []).length} notes cached)`
    );
    offlineService.notifyDataRefreshed();
    return pages;
  } catch (error) {
    offlineService.setSyncStatus(false, null);
    throw error;
  }
}

async function syncAllForOffline() {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    statusService.warn("Cannot run full offline sync while disconnected");
    return null;
  }

  offlineService.setSyncStatus(true, {
    current: 1,
    total: 3,
    label: "Pushing pending changes & downloading trees...",
  });
  const opId = statusService.start("Syncing entire Journal for offline use...");

  try {
    await syncPendingChanges();

    const [activeTree, fullTree] = await Promise.all([
      invokeCall(async (header) => {
        const res = await axios.post(
          `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_GET}`,
          { includeArchived: false },
          header
        );
        return res.data;
      }),
      invokeCall(async (header) => {
        const res = await axios.post(
          `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_GET}`,
          { includeArchived: true },
          header
        );
        return res.data;
      }),
    ]);

    if (activeTree) await offlineService.saveTreeCache(activeTree, false);
    if (fullTree) await offlineService.saveTreeCache(fullTree, true);

    const rootNode = Array.isArray(activeTree) ? activeTree[0] : activeTree;
    if (!rootNode || rootNode.id == null) {
      offlineService.setSyncStatus(false, null);
      statusService.warn("No root journal found to sync");
      return [];
    }

    offlineService.setSyncStatus(true, {
      current: 2,
      total: 3,
      label: "Downloading all notes across all trees...",
    });

    const allPages = await invokeCall(async (header) => {
      const res = await axios.post(
        `${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETINGS_ACTION}`,
        { Id: Number(rootNode.id), DrillDown: true },
        header
      );
      return res.data;
    });

    offlineService.setSyncStatus(true, {
      current: 3,
      total: 3,
      label: "Saving notes to local IndexedDB...",
    });

    await offlineService.cacheSubtreePages(rootNode.id, allPages || [], {
      markSynced: true,
      isFullSync: true,
    });

    offlineService.setSyncStatus(false, null);
    statusService.success(
      opId,
      `All trees synced for offline (${(allPages || []).length} notes saved locally)`
    );
    offlineService.notifyDataRefreshed();
    return allPages;
  } catch (error) {
    console.error("Full offline sync failed:", error);
    offlineService.setSyncStatus(false, null);
    statusService.error(opId, "Full offline sync failed");
    throw error;
  }
}

offlineService.registerSyncRunner(syncPendingChanges);

async function uploadPhoto(photo, journalId, pageId) {
  let call = async (header) => {
    const formData = new FormData();
    let photoName = "journalId-" + journalId + "-pageId-" + pageId + "-" + photo.name;
    formData.append("file", photo, photoName);

    const response = await axios.post(`${config.PATH_BASE}Image/Upload`, formData, header);
    return response.data;
  };
  return invokeCallWithToast(call, "Trying to upload photo", "Photo uploaded");
}

async function getUserEmail() {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return auth?.currentUser?.email || localStorage.getItem("cachedUserEmail") || "offline";
  }
  let call = async (header) => {
    const data = { Id: 1, DrillDown: true };
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/UserEmail`,
      data,
      header
    );
    return response.data;
  };
  try {
    return await invokeCallWithToast(call, "Trying to get user email", "User email returned");
  } catch (error) {
    if (isOfflineOrNetworkError(error)) {
      return auth?.currentUser?.email || localStorage.getItem("cachedUserEmail") || "offline";
    }
    throw error;
  }
}

async function getCookie(idtoken) {
  var response = await axios.get(
    `${config.PATH_BASE}Session/LoginGet?token=${auth.currentUser.accessToken}`,
    {
      withCredentials: true,
    }
  );
  console.log(response.data);
}

async function getValidToken() {
  let token = localStorage.getItem("token");
  const currentUser = auth.currentUser;

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return token;
  }

  let needsRefresh = !token;
  if (token) {
    try {
      if (isJwtExpired(token)) {
        needsRefresh = true;
      }
    } catch (e) {
      needsRefresh = true;
    }
  }

  if (currentUser) {
    try {
      const freshToken = await currentUser.getIdToken(needsRefresh);
      if (freshToken && freshToken !== token) {
        localStorage.setItem("token", freshToken);
        const now = new Date();
        localStorage.setItem("tokenRefreshTime", now.toISOString());
      }
      return freshToken || token;
    } catch (err) {
      console.error("Failed to get token from Firebase:", err);
    }
  }
  return token;
}

async function invokeCall(call) {
  let token = await getValidToken();
  const header = { headers: { Authorization: `Bearer ${token}` } };
  try {
    const response = await call(header);
    return response;
  } catch (error) {
    if (error?.response?.status === 401 && auth.currentUser && navigator.onLine) {
      console.log("Received 401, forcing token refresh and retrying request...");
      const freshToken = await auth.currentUser.getIdToken(true);
      localStorage.setItem("token", freshToken);
      const now = new Date();
      localStorage.setItem("tokenRefreshTime", now.toISOString());
      const retryHeader = { headers: { Authorization: `Bearer ${freshToken}` } };
      return await call(retryHeader);
    }
    throw error;
  }
}

async function getPagePublicHash(pageId) {
  let call = async (header) => {
    const data = {
      Id: parseInt(pageId),
      PageId: parseInt(pageId),
    };
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/GetPublicHash`,
      data,
      header
    );
    return response.data;
  };
  return invokeCallWithToast(call, "Getting page public link", "Page public link returned");
}

async function getJournalPublicHash(journalId) {
  let call = async (header) => {
    const data = {
      Id: parseInt(journalId),
      JournalId: parseInt(journalId),
      TreeId: parseInt(journalId),
    };
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/GetPublicHash`,
      data,
      header
    );
    return response.data;
  };
  return invokeCallWithToast(
    call,
    "Getting journal public link",
    "Journal public link returned"
  );
}

async function getPagesWithoutPlainText() {
  let call = async (header) => {
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/GetPagesWithoutPlainText`,
      {},
      header
    );
    return response.data;
  };
  return invokeCallWithToast(
    call,
    "Fetching unmigrated pages",
    "Unmigrated pages fetched"
  );
}

async function getPublicTreeNotes(guid) {
  const response = await axios.get(
    `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/Public/${guid}`
  );
  return response.data;
}

export {
  getTree,
  getUserEmail,
  addTreeNode,
  deleteTree,
  moveTreeNode,
  renameJournal,
  savePage,
  fetchMeeting,
  deleteMeeting,
  updateJournal,
  getDate,
  getDate2,
  fetchPageList,
  uploadPhoto,
  getCookie,
  getPagePublicHash,
  getJournalPublicHash,
  getPagesWithoutPlainText,
  setInboxName,
  removeInboxName,
  archiveJournal,
  unarchiveJournal,
  getPublicTreeNotes,
  syncPendingChanges,
  syncSubtreeForOffline,
  syncAllForOffline,
};
