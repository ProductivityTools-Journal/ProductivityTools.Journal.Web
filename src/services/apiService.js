import axios from 'axios'
import * as Consts from 'Consts';
import { config } from 'Consts';
import { AuthService } from '../OAuth/OAuth';

async function getTree() {
    const response = await axios.post(`${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_GET}`)
    return response.data;
}

async function addTreeNode(name,parent) {
    let call = async (header) => {
        const data = { Name: name, Parent: parent }
        const response = await axios.post(`${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_ADDITEM}`, data, header)
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
    const data = {
        Id: parseInt(id),
        Secret: 'xxx'
    }
    const response = await axios.post(`${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETING_ACTION}`, data)
    return response.data;
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

async function callAuthorizedEndpoint(call) {
    let authService = new AuthService();
    return await authService.getUser().then(async user => {
        if (user && user.access_token) {
            const header = {
                headers: { Authorization: `Bearer ${user.access_token}` }
            };
            try {
                const result = await call(header);
                return result;
            }
            catch (error) {
                if (error.response != null && error.response.status === 401) {
                    console.log("try to renew token");
                    authService.renewToken().then(async renewedToken => {
                        const header = {
                            headers: { Authorization: `Bearer ${renewedToken.access_token}` }
                        };
                        const result = await call(header);
                        return result;
                    })
                }
            }
        } else if (user) {
            console.log("api call2");
        }
        else {
            console.log("api cal4l");
        }
    })
}

async function fetchMeetingList(treeId) {

    let call = async (header) => {
        const data = { Id: Number(treeId), DrillDown: false }
        const response = await axios.post(`${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETINGS_ACTION}`, data, header)
        console.log(response.data);
        return response.data;
    }
    return callAuthorizedEndpoint(call);

    // let authService = new AuthService();
    // return await authService.getUser().then(async user => {
    //     if (user && user.access_token) {
    //         const header = {
    //             headers: { Authorization: `Bearer ${user.access_token}` }
    //         };
    //         console.log("api call");
    //         console.log(user);
    //         const data = { Id: Number(treeId), DrillDown: false }
    //         const response = await axios.post(`${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETINGS_ACTION}`, data, header)

    //         console.log(response.data);
    //         return response.data;
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
    saveMeeting,
    fetchMeeting,
    updateMeeting,
    getDate,
    fetchMeetingList
}