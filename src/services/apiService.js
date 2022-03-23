import axios from 'axios'
import * as Consts from 'Consts';
import { config } from 'Consts';
import { AuthService } from '../OAuth/OAuth';
import { toast } from 'react-toastify';
import { auth } from '../Session/firebase'

async function getTree() {
     debugger;
     console.log(auth);
    // var x = await axios.post(`${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_GET}`)
    // return x.data;

    let call = async (header) => {
        debugger;
        const response = await axios.post(`${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_GET}`)
        return response.data;
    }
    return callAuthorizedEndpointWithToast(call, "Trying to get tree", "Tree returned");
}

async function addTreeNode(parentId, name) {
    let call = async (header) => {
        const data = { ParentId: parentId, Name: name }
        const response = await axios.post(`${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_ADDITEM}`, data, header)
        console.log(response.data);
        return response.data;
    }
    return callAuthorizedEndpoint(call);
}

async function moveTreeNode(sourceId, targetParentId) {
    let call = async (header) => {
        const data = { SourceId: sourceId, ParentTargetId: targetParentId }
        const response = await axios.post(`${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_MOVEITEM}`, data, header);
        console.group(response.data);
        return response.data;
    }
    return callAuthorizedEndpointWithToast(call, "Moving tree element", "Tree element moed")
}

async function deleteTree(treeId) {
    let call = async (header) => {
        const data = { TreeId: Number(treeId) }
        const response = await axios.post(`${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_DELETE}`, data, header)
        console.log(response.data);
        return response.data;
    }
    return callAuthorizedEndpoint(call);
}

async function saveMeeting(meeting) {
    const response = await axios.post(`${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETING_NEW_MEETING}`, meeting)
    return response.data;
}

async function fetchMeeting(id) {
    let call = async (header) => {
        const data = {
            Id: parseInt(id),
        }
        const response = await axios.post(`${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETING_ACTION}`, data, header)
        return response.data;
    }

    return callAuthorizedEndpointWithToast(call, "Trying to get Journal details", "Journal details returned");

}

async function updateMeeting(meeting) {
    console.log("updating meeeting");
    console.log(meeting);
    const response = await axios.post(`${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETING_UPDATE_MEETING}`, meeting)
    return response.data;
}

async function getDate() {
    const response = await axios.post(`${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETINGS_DATE}`)
    return response.data;
}

async function callAuthorizedEndpointWithToast(call, pendingMessage, successMessage) {
    return toast.promise(
        callAuthorizedEndpoint(call),
        {
            pending: pendingMessage ? pendingMessage : "Missing pending message",
            success: successMessage ? successMessage : "Missing sucesss message",
            error: 'something happned!!!!'
        }
    )
}

async function fetchMeetingList(treeId) {

    let call = async (header) => {
        const data = { Id: Number(treeId), DrillDown: true }
        const response = await axios.post(`${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETINGS_ACTION}`, data, header)
        console.log(response.data);
        return response.data;
    }
    return callAuthorizedEndpointWithToast(call, "Trying to meeting list", "Meeting list returned");
}

async function callAuthorizedEndpoint(call) {
    debugger;
    console.log(auth);
    console.log(auth.currentUser);
    console.log(auth.currentUser.accessToken);
    debugger;
    console.log(auth);
    debugger;
    if (auth && auth.currentUser && auth.currentUser.accessToken) {
        const header = {
            headers: { Authorization: `Bearer ${auth.currentUser.accessToken}` }
        };
        debugger;
        try {
            const result = await call(header);
            return result;
        }
        catch (error) {
            console.log(error)
        }
    }

    else {
        console.log("User not authenticated")
    }
    // return await authService.getUser().then(async user => {
    //     if (user && user.access_token) {
    //         const header = {
    //             headers: { Authorization: `Bearer ${user.access_token}` }
    //         };
    //         try {
    //             const result = await call(header);
    //             return result;
    //         }
    //         catch (error) {
    //             if (error.response != null && error.response.status === 401) {
    //                 console.log("try to renew token");
    //                 authService.renewToken().then(async renewedToken => {
    //                     const header = {
    //                         headers: { Authorization: `Bearer ${renewedToken.access_token}` }
    //                     };
    //                     const result = await call(header);
    //                     return result;
    //                 })
    //             }
    //         }
    //     } else if (user) {
    //         console.log("api call2");
    //     }
    //     else {
    //         console.log("api cal4l");
    //     }
    // })
}



export {
    getTree,
    addTreeNode,
    deleteTree,
    moveTreeNode,
    saveMeeting,
    fetchMeeting,
    updateMeeting,
    getDate,
    fetchMeetingList
}