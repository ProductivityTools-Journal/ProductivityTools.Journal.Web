import axios from "axios";
import * as Consts from "Consts";
import { config } from "Consts";
import { auth } from "../Session/firebase";
import { isJwtExpired } from "jwt-check-expiration";
import statusService from "./statusService";

async function getTree() {
  console.log("GetTreeInvoked");
  console.log(auth);
  let call = async (header) => {
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_GET}`,
      {},
      header
    );
    return response.data;
  };
  return invokeCallWithToast(call, "Trying to get tree", "Tree returned");
}

// async function getTreePaths(journalIds){
//   console.log("GetTreePathInvoked");
//   console.log(auth);
//   let call = async (header) => {
//     const data = { JournalIds: journalIds};

//     const response = await axios.post(
//       `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/GetJournalsPath`,
//       data,
//       header
//     );
//     return response.data;
//   };
//   return invokeCallWithToast(call, "Trying to get path tree", "Path tree returned");
// }

async function addTreeNode(parentId, name) {
  let call = async (header) => {
    const data = { ParentId: parentId, Name: name };
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_ADDITEM}`,
      data,
      header
    );
    console.log(response.data);
    return response.data;
  };
  return invokeCallWithToast(call, "Adding tree item", "Tree item added");
}

async function moveTreeNode(sourceId, targetParentId) {
  let call = async (header) => {
    const data = { SourceId: sourceId, ParentTargetId: targetParentId };
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_MOVEITEM}`,
      data,
      header
    );
    console.group(response.data);
    return response.data;
  };
  return invokeCallWithToast(call, "Moving tree element", "Tree element moved");
}

async function deleteTree(treeId) {
  let call = async (header) => {
    const data = { TreeId: Number(treeId) };
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_DELETE}`,
      data,
      header
    );
    console.log(response.data);
    return response.data;
  };
  return invokeCallWithToast(call,"delete tree", "tree deleted");
}

async function renameJournal(journalId, newName) {
  let call = async (header) => {
    const data = { JournalId: journalId, NewName: newName };
    const response = await axios.post(`${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/Rename`, data, header);
    console.log(response.data);
    return response.data;
  };
  return invokeCallWithToast(call, "renaming", "renamed");
}

async function setInboxName(journalId, inboxName) {
  let call = async (header) => {
    const data = { JournalId: Number(journalId), InboxName: inboxName };
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_SET_INBOX_NAME}`,
      data,
      header
    );
    console.log(response.data);
    return response.data;
  };
  return invokeCallWithToast(call, "Setting inbox name", "Inbox name set");
}

async function removeInboxName(journalId) {
  let call = async (header) => {
    const data = { Id: Number(journalId) };
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_REMOVE_INBOX_NAME}`,
      data,
      header
    );
    console.log(response.data);
    return response.data;
  };
  return invokeCallWithToast(call, "Removing inbox name", "Inbox name removed");
}

async function savePage(page) {
  let call = async (header) => {
    console.log("saveMeeting");
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETING_NEW_MEETING}`,
      page,
      header
    );
    return response.data;
  };
  return invokeCallWithToast(call, "Creating new Journal Item", "New Journal Item created");
}

async function fetchMeeting(id) {
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

  return invokeCallWithToast(call, "Trying to get Journal details", "Journal details returned");
}

async function updateJournal(meeting) {
  let call = async (header) => {
    console.log("updating meeeting");
    console.log(meeting);
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETING_UPDATE_MEETING}`,
      meeting,
      header
    );
    return response.data;
  };
  return invokeCallWithToast(call, "Updating Journal Item", "Journal Item Updated");
}

async function getDate() {
  const response = await axios.post(
    `${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETINGS_DATE}`
  );
  return response.data;
}

async function getDate2() {
  const response = await axios.post(
    `${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/Date2`
  );
  return response.data;
}


async function deleteMeeting(journalId) {
  let call = async (header) => {
    console.log(journalId);
    const data = { Id: journalId };
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETINGS_DELETE}`,
      data,
      header
    );
    return response.data;
  };
  return invokeCallWithToast(call, "Deleting Journal Item", "Journal Item deleted");
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
  let call = async (header) => {
    const data = { Id: Number(treeId), DrillDown: true };
    const response = await axios.post(
      `${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETINGS_ACTION}`,
      data,
      header
    );
    console.log(response.data);
    return response.data;
  };
  return invokeCallWithToast(call, "Trying to meeting list", "Meeting list returned");
}

async function uploadPhoto(photo, journalId, pageId) {
  let call = async (header) => {
    const formData = new FormData();
    let photoName = "journalId-" + journalId + "-pageId-" + pageId + "-" + photo.name;
    formData.append("file", photo, photoName);

    console.log(photo);

    const response = await axios.post(`${config.PATH_BASE}Image/Upload`, formData, header);
    return response.data;
  };
  return invokeCallWithToast(call, "Trying to upload photo", "Photo uploaded");
}

async function getUserEmail() {
  let call = async (header) => {
    const data = { Id: 1, DrillDown: true };
    const response = await axios.post(`${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/UserEmail`, data, header);
    console.log(response.data);
    return response.data;
  };
  return invokeCallWithToast(call, "Trying to get user email", "User email returned");
}

async function getCookie(idtoken) {
  const header = {
    headers: {},
  };
  console.log(header);
  var response = await axios.get(`${config.PATH_BASE}Session/LoginGet?token=${auth.currentUser.accessToken}`, {
    withCredentials: true,
  });
  console.log(response.data);
}

async function getValidToken() {
  let token = localStorage.getItem("token");
  const currentUser = auth.currentUser;

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
    if (error?.response?.status === 401 && auth.currentUser) {
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
  return invokeCallWithToast(call, "Getting journal public link", "Journal public link returned");
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
  return invokeCallWithToast(call, "Fetching unmigrated pages", "Unmigrated pages fetched");
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
  getPublicTreeNotes,
};
