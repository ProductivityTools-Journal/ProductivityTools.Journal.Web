import statusService from "./statusService";

const DB_NAME = "ProductivityToolsJournalOfflineDB";
const DB_VERSION = 1;
const STORE_META = "meta";
const STORE_PAGES = "pages";
const STORE_OUTBOX = "outbox";

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not supported"));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORE_PAGES)) {
        const pageStore = db.createObjectStore(STORE_PAGES, { keyPath: "pageId" });
        pageStore.createIndex("journalId", "journalId", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
        db.createObjectStore(STORE_OUTBOX, { keyPath: "opId", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function getMeta(key) {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_META, "readonly");
      const req = tx.objectStore(STORE_META).get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB getMeta error:", err);
    return null;
  }
}

async function setMeta(key, value) {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_META, "readwrite");
      tx.objectStore(STORE_META).put({ key, value, updatedAt: new Date().toISOString() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("IndexedDB setMeta error:", err);
  }
}

async function getAllPagesFromDB() {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PAGES, "readonly");
      const req = tx.objectStore(STORE_PAGES).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB getAllPagesFromDB error:", err);
    return [];
  }
}

async function getPageFromDB(pageId) {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PAGES, "readonly");
      const req = tx.objectStore(STORE_PAGES).get(Number(pageId));
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB getPageFromDB error:", err);
    return null;
  }
}

async function putPageInDB(page) {
  if (!page || page.pageId == null) return;
  try {
    const db = await openDB();
    const normalized = {
      ...page,
      pageId: Number(page.pageId),
      journalId: page.journalId != null ? Number(page.journalId) : page.journalId,
    };
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PAGES, "readwrite");
      tx.objectStore(STORE_PAGES).put(normalized);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("IndexedDB putPageInDB error:", err);
  }
}

async function deletePageFromDB(pageId) {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PAGES, "readwrite");
      tx.objectStore(STORE_PAGES).delete(Number(pageId));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("IndexedDB deletePageFromDB error:", err);
  }
}

async function getOutboxFromDB() {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OUTBOX, "readonly");
      const req = tx.objectStore(STORE_OUTBOX).getAll();
      req.onsuccess = () => {
        const items = req.result || [];
        items.sort((a, b) => a.opId - b.opId);
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB getOutboxFromDB error:", err);
    return [];
  }
}

async function putOutboxItem(item) {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OUTBOX, "readwrite");
      const req = tx.objectStore(STORE_OUTBOX).put(item);
      req.onsuccess = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("IndexedDB putOutboxItem error:", err);
    return null;
  }
}

async function deleteOutboxItem(opId) {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OUTBOX, "readwrite");
      tx.objectStore(STORE_OUTBOX).delete(opId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("IndexedDB deleteOutboxItem error:", err);
  }
}

function cloneTree(tree) {
  if (!tree) return null;
  return JSON.parse(JSON.stringify(tree));
}

function findNodeInTree(node, targetId) {
  if (!node || targetId == null) return null;
  const numTarget = Number(targetId);
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findNodeInTree(item, numTarget);
      if (found) return found;
    }
    return null;
  }
  if (Number(node.id) === numTarget) {
    return node;
  }
  if (Array.isArray(node.nodes)) {
    for (const child of node.nodes) {
      const found = findNodeInTree(child, numTarget);
      if (found) return found;
    }
  }
  return null;
}

function collectDescendantIds(node, includeArchived = false, acc = new Set()) {
  if (!node) return acc;
  if (Array.isArray(node)) {
    for (const item of node) {
      collectDescendantIds(item, includeArchived, acc);
    }
    return acc;
  }
  if (node.id != null) {
    acc.add(Number(node.id));
  }
  if (Array.isArray(node.nodes)) {
    for (const child of node.nodes) {
      if (!includeArchived && child.archived) {
        continue;
      }
      collectDescendantIds(child, includeArchived, acc);
    }
  }
  return acc;
}

class OfflineService {
  constructor() {
    this.listeners = new Set();
    this.dataRefreshListeners = new Set();
    this.state = {
      isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
      isSyncing: false,
      syncProgress: null,
      outboxItems: [],
      outboxCount: 0,
      syncedNodes: {},
      lastFullSyncAt: null,
      cachedPagesCount: 0,
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.setOnlineStatus(true);
        statusService.info("Connection restored — checking pending offline changes...");
        if (this.syncRunner) {
          this.syncRunner();
        }
      });
      window.addEventListener("offline", () => {
        this.setOnlineStatus(false);
        statusService.warn("Working offline — changes will be saved locally and queued");
      });
    }

    this.init();
  }

  async init() {
    await this.refreshStateFromDB();
  }

  registerSyncRunner(fn) {
    this.syncRunner = fn;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  onDataRefreshed(listener) {
    this.dataRefreshListeners.add(listener);
    return () => this.dataRefreshListeners.delete(listener);
  }

  notifyDataRefreshed() {
    this.dataRefreshListeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error("Error in onDataRefreshed listener:", err);
      }
    });
  }

  getState() {
    return this.state;
  }

  emit() {
    const snapshot = { ...this.state };
    this.listeners.forEach((listener) => listener(snapshot));
  }

  setOnlineStatus(isOnline) {
    if (this.state.isOnline !== isOnline) {
      this.state = { ...this.state, isOnline };
      this.emit();
    }
  }

  async refreshStateFromDB() {
    const [outboxItems, syncedNodes, lastFullSyncAt, allPages] = await Promise.all([
      getOutboxFromDB(),
      getMeta("syncedNodes"),
      getMeta("lastFullSyncAt"),
      getAllPagesFromDB(),
    ]);
    this.state = {
      ...this.state,
      outboxItems: outboxItems || [],
      outboxCount: (outboxItems || []).length,
      syncedNodes: syncedNodes || {},
      lastFullSyncAt: lastFullSyncAt || null,
      cachedPagesCount: (allPages || []).filter((p) => !p.Deleted).length,
    };
    this.emit();
  }

  isNetworkError(error) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return true;
    }
    if (!error) return false;
    if (!error.response && (error.code === "ERR_NETWORK" || error.message === "Network Error" || error.message?.includes("Failed to fetch") || error.message?.includes("network-request-failed"))) {
      return true;
    }
    return false;
  }

  // ---- TREE CACHE ----

  async saveTreeCache(tree, includeArchived = false) {
    if (!tree) return;
    const key = includeArchived ? "tree_true" : "tree_false";
    await setMeta(key, tree);
  }

  async getTreeCache(includeArchived = false) {
    const key = includeArchived ? "tree_true" : "tree_false";
    let cached = await getMeta(key);
    if (!cached && !includeArchived) {
      const archivedTree = await getMeta("tree_true");
      if (archivedTree) {
        cached = this.filterArchivedFromTree(cloneTree(archivedTree));
      }
    }
    return cached;
  }

  filterArchivedFromTree(node) {
    if (!node) return null;
    if (Array.isArray(node)) {
      return node.filter((n) => !n.archived).map((n) => this.filterArchivedFromTree(n));
    }
    return {
      ...node,
      nodes: Array.isArray(node.nodes)
        ? node.nodes.filter((n) => !n.archived).map((n) => this.filterArchivedFromTree(n))
        : [],
    };
  }

  async getSubtreeNodeIds(treeId, includeArchived = false) {
    const treeTrue = await getMeta("tree_true");
    const treeFalse = await getMeta("tree_false");
    const baseTree = (includeArchived ? treeTrue : treeFalse) || treeTrue || treeFalse;
    if (!baseTree) {
      return new Set([Number(treeId)]);
    }
    const targetNode = findNodeInTree(baseTree, treeId);
    if (!targetNode) {
      return new Set([Number(treeId)]);
    }
    return collectDescendantIds(targetNode, includeArchived);
  }

  async mutateCachedTrees(mutatorFn) {
    const [treeFalse, treeTrue] = await Promise.all([
      getMeta("tree_false"),
      getMeta("tree_true"),
    ]);
    if (treeFalse) {
      const copyFalse = cloneTree(treeFalse);
      mutatorFn(copyFalse, false);
      await setMeta("tree_false", copyFalse);
    }
    if (treeTrue) {
      const copyTrue = cloneTree(treeTrue);
      mutatorFn(copyTrue, true);
      await setMeta("tree_true", copyTrue);
    }
  }

  // ---- PAGES CACHE ----

  async cacheSubtreePages(treeId, pagesFromServer, options = { markSynced: false, isFullSync: false }) {
    const subtreeIds = await this.getSubtreeNodeIds(treeId, false);
    const outbox = await getOutboxFromDB();
    const pendingPageIds = new Set();
    const deletedPageIds = new Set();

    for (const op of outbox) {
      if (op.type === "SAVE_PAGE" || op.type === "UPDATE_PAGE") {
        if (op.payload?.pageId != null) {
          pendingPageIds.add(Number(op.payload.pageId));
        }
      } else if (op.type === "DELETE_PAGE") {
        if (op.payload?.Id != null) {
          deletedPageIds.add(Number(op.payload.Id));
        }
      }
    }

    const existingPages = await getAllPagesFromDB();
    const serverPageIds = new Set((pagesFromServer || []).map((p) => Number(p.pageId)));

    // Remove stale server pages in this subtree that were deleted on the server
    for (const existing of existingPages) {
      const pid = Number(existing.pageId);
      const jid = Number(existing.journalId);
      if (pid > 0 && subtreeIds.has(jid) && !serverPageIds.has(pid) && !pendingPageIds.has(pid)) {
        await deletePageFromDB(pid);
      }
    }

    // Store fresh pages from server unless overridden by local pending edit/delete
    for (const page of pagesFromServer || []) {
      const pid = Number(page.pageId);
      if (deletedPageIds.has(pid)) {
        continue;
      }
      if (pendingPageIds.has(pid)) {
        continue;
      }
      await putPageInDB({
        ...page,
        pageId: pid,
        journalId: Number(page.journalId),
        isOfflinePending: false,
      });
    }

    if (options?.markSynced) {
      const nowIso = new Date().toISOString();
      const syncedNodes = (await getMeta("syncedNodes")) || {};
      subtreeIds.forEach((id) => {
        syncedNodes[id] = { syncedAt: nowIso };
      });
      await setMeta("syncedNodes", syncedNodes);
      if (options?.isFullSync) {
        await setMeta("lastFullSyncAt", nowIso);
      }
    }

    await this.refreshStateFromDB();
  }

  async getCachedPagesForSubtree(treeId) {
    const subtreeIds = await this.getSubtreeNodeIds(treeId, false);
    const allPages = await getAllPagesFromDB();
    return allPages.filter(
      (p) => !p.Deleted && p.journalId != null && subtreeIds.has(Number(p.journalId))
    );
  }

  async getCachedPage(pageId) {
    return await getPageFromDB(pageId);
  }

  // ---- OFFLINE MUTATIONS (PAGES) ----

  async savePageOffline(page) {
    const tempPageId =
      page.pageId != null && Number(page.pageId) < 0
        ? Number(page.pageId)
        : -Date.now();

    const savedPage = {
      ...page,
      pageId: tempPageId,
      journalId: Number(page.journalId),
      date: page.date || new Date().toISOString(),
      isOfflinePending: true,
    };

    await putPageInDB(savedPage);

    const outbox = await getOutboxFromDB();
    const existingOp = outbox.find(
      (op) => op.type === "SAVE_PAGE" && Number(op.payload?.pageId) === tempPageId
    );

    if (existingOp) {
      await putOutboxItem({
        ...existingOp,
        payload: savedPage,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await putOutboxItem({
        type: "SAVE_PAGE",
        payload: savedPage,
        description: `Create note in journal #${savedPage.journalId}`,
        createdAt: new Date().toISOString(),
      });
    }

    await this.refreshStateFromDB();
    return savedPage;
  }

  async updatePageOffline(page) {
    const pid = Number(page.pageId);
    const existing = (await getPageFromDB(pid)) || {};
    const updatedPage = {
      ...existing,
      ...page,
      pageId: pid,
      journalId: Number(page.journalId ?? existing.journalId),
      isOfflinePending: true,
    };

    await putPageInDB(updatedPage);

    const outbox = await getOutboxFromDB();
    if (pid < 0) {
      const existingSaveOp = outbox.find(
        (op) => op.type === "SAVE_PAGE" && Number(op.payload?.pageId) === pid
      );
      if (existingSaveOp) {
        await putOutboxItem({
          ...existingSaveOp,
          payload: updatedPage,
          updatedAt: new Date().toISOString(),
        });
        await this.refreshStateFromDB();
        return updatedPage;
      }
    }

    const existingUpdateOp = outbox.find(
      (op) => op.type === "UPDATE_PAGE" && Number(op.payload?.pageId) === pid
    );

    if (existingUpdateOp) {
      await putOutboxItem({
        ...existingUpdateOp,
        payload: updatedPage,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await putOutboxItem({
        type: "UPDATE_PAGE",
        payload: updatedPage,
        description: `Update note #${pid}`,
        createdAt: new Date().toISOString(),
      });
    }

    await this.refreshStateFromDB();
    return updatedPage;
  }

  async deletePageOffline(pageId) {
    const pid = Number(pageId);
    await deletePageFromDB(pid);

    const outbox = await getOutboxFromDB();
    for (const op of outbox) {
      if (
        (op.type === "SAVE_PAGE" || op.type === "UPDATE_PAGE") &&
        Number(op.payload?.pageId) === pid
      ) {
        await deleteOutboxItem(op.opId);
      }
    }

    if (pid > 0) {
      await putOutboxItem({
        type: "DELETE_PAGE",
        payload: { Id: pid },
        description: `Delete note #${pid}`,
        createdAt: new Date().toISOString(),
      });
    }

    await this.refreshStateFromDB();
    return true;
  }

  // ---- OFFLINE MUTATIONS (TREE) ----

  async addTreeNodeOffline(parentId, name) {
    const tempId = -Date.now();
    const newNode = {
      id: tempId,
      parentId: Number(parentId),
      name,
      archived: false,
      nodes: [],
      isOfflinePending: true,
    };

    await this.mutateCachedTrees((tree) => {
      const parent = findNodeInTree(tree, parentId);
      if (parent) {
        if (!Array.isArray(parent.nodes)) {
          parent.nodes = [];
        }
        parent.nodes.push({ ...newNode });
        parent.nodes.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      }
    });

    await putOutboxItem({
      type: "ADD_TREE_NODE",
      payload: { ParentId: Number(parentId), Name: name, tempId },
      description: `Add folder "${name}"`,
      createdAt: new Date().toISOString(),
    });

    await this.refreshStateFromDB();
    return tempId;
  }

  async renameTreeNodeOffline(journalId, newName) {
    const jid = Number(journalId);
    await this.mutateCachedTrees((tree) => {
      const node = findNodeInTree(tree, jid);
      if (node) {
        node.name = newName;
        node.isOfflinePending = true;
      }
    });

    const outbox = await getOutboxFromDB();
    if (jid < 0) {
      const addOp = outbox.find(
        (op) => op.type === "ADD_TREE_NODE" && Number(op.payload?.tempId) === jid
      );
      if (addOp) {
        await putOutboxItem({
          ...addOp,
          payload: { ...addOp.payload, Name: newName },
        });
        await this.refreshStateFromDB();
        return { id: jid, name: newName };
      }
    }

    await putOutboxItem({
      type: "RENAME_TREE_NODE",
      payload: { JournalId: jid, NewName: newName },
      description: `Rename folder #${jid} to "${newName}"`,
      createdAt: new Date().toISOString(),
    });

    await this.refreshStateFromDB();
    return { id: jid, name: newName };
  }

  async moveTreeNodeOffline(sourceId, targetParentId) {
    const sid = Number(sourceId);
    const tid = Number(targetParentId);

    await this.mutateCachedTrees((tree) => {
      const sourceNode = findNodeInTree(tree, sid);
      if (!sourceNode) return;
      const oldParent = findNodeInTree(tree, sourceNode.parentId);
      if (oldParent && Array.isArray(oldParent.nodes)) {
        oldParent.nodes = oldParent.nodes.filter((n) => Number(n.id) !== sid);
      }
      const newParent = findNodeInTree(tree, tid);
      if (newParent) {
        if (!Array.isArray(newParent.nodes)) {
          newParent.nodes = [];
        }
        sourceNode.parentId = tid;
        sourceNode.isOfflinePending = true;
        newParent.nodes.push(sourceNode);
        newParent.nodes.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      }
    });

    await putOutboxItem({
      type: "MOVE_TREE_NODE",
      payload: { SourceId: sid, ParentTargetId: tid },
      description: `Move folder #${sid} to #${tid}`,
      createdAt: new Date().toISOString(),
    });

    await this.refreshStateFromDB();
    return true;
  }

  async deleteTreeNodeOffline(treeId) {
    const tid = Number(treeId);
    const subtreeIds = await this.getSubtreeNodeIds(tid, true);

    await this.mutateCachedTrees((tree) => {
      const target = findNodeInTree(tree, tid);
      if (!target) return;
      const parent = findNodeInTree(tree, target.parentId);
      if (parent && Array.isArray(parent.nodes)) {
        parent.nodes = parent.nodes.filter((n) => Number(n.id) !== tid);
      }
    });

    const allPages = await getAllPagesFromDB();
    for (const p of allPages) {
      if (subtreeIds.has(Number(p.journalId))) {
        await deletePageFromDB(p.pageId);
      }
    }

    await putOutboxItem({
      type: "DELETE_TREE_NODE",
      payload: { TreeId: tid },
      description: `Delete folder #${tid}`,
      createdAt: new Date().toISOString(),
    });

    await this.refreshStateFromDB();
    return 1;
  }

  async archiveTreeNodeOffline(journalId, archived = true) {
    const jid = Number(journalId);
    await this.mutateCachedTrees((tree, isIncludeArchivedTree) => {
      const node = findNodeInTree(tree, jid);
      if (node) {
        node.archived = Boolean(archived);
        node.isOfflinePending = true;
        if (!isIncludeArchivedTree && archived) {
          const parent = findNodeInTree(tree, node.parentId);
          if (parent && Array.isArray(parent.nodes)) {
            parent.nodes = parent.nodes.filter((n) => Number(n.id) !== jid);
          }
        }
      }
    });

    await putOutboxItem({
      type: archived ? "ARCHIVE_TREE_NODE" : "UNARCHIVE_TREE_NODE",
      payload: { JournalId: jid, Archived: Boolean(archived) },
      description: `${archived ? "Archive" : "Unarchive"} folder #${jid}`,
      createdAt: new Date().toISOString(),
    });

    await this.refreshStateFromDB();
    return { id: jid, archived: Boolean(archived) };
  }

  async setInboxNameOffline(journalId, inboxName) {
    const jid = Number(journalId);
    await this.mutateCachedTrees((tree) => {
      const node = findNodeInTree(tree, jid);
      if (node) {
        node.inboxName = inboxName;
        node.InboxName = inboxName;
        node.isOfflinePending = true;
      }
    });

    await putOutboxItem({
      type: "SET_INBOX_NAME",
      payload: { JournalId: jid, InboxName: inboxName },
      description: `Set inbox "${inboxName}" on folder #${jid}`,
      createdAt: new Date().toISOString(),
    });

    await this.refreshStateFromDB();
    return { id: jid, inboxName };
  }

  async removeInboxNameOffline(journalId) {
    const jid = Number(journalId);
    await this.mutateCachedTrees((tree) => {
      const node = findNodeInTree(tree, jid);
      if (node) {
        node.inboxName = null;
        node.InboxName = null;
        node.isOfflinePending = true;
      }
    });

    await putOutboxItem({
      type: "REMOVE_INBOX_NAME",
      payload: { Id: jid },
      description: `Remove inbox on folder #${jid}`,
      createdAt: new Date().toISOString(),
    });

    await this.refreshStateFromDB();
    return { id: jid, inboxName: null };
  }

  // ---- OUTBOX REPLAY & PRE-FLIGHT SYNC HELPERS ----

  setSyncStatus(isSyncing, syncProgress = null) {
    this.state = {
      ...this.state,
      isSyncing,
      syncProgress,
    };
    this.emit();
  }

  async getOutbox() {
    return await getOutboxFromDB();
  }

  async removeOutboxOp(opId) {
    await deleteOutboxItem(opId);
    await this.refreshStateFromDB();
  }

  async replaceTempPageWithServerPage(tempPageId, serverPage) {
    await deletePageFromDB(tempPageId);
    if (serverPage && serverPage.pageId != null) {
      await putPageInDB({
        ...serverPage,
        pageId: Number(serverPage.pageId),
        journalId: Number(serverPage.journalId),
        isOfflinePending: false,
      });
    }
    await this.refreshStateFromDB();
  }

  async markPageSynced(pageId) {
    const existing = await getPageFromDB(pageId);
    if (existing) {
      await putPageInDB({
        ...existing,
        isOfflinePending: false,
      });
      await this.refreshStateFromDB();
    }
  }
}

const offlineService = new OfflineService();
export default offlineService;
