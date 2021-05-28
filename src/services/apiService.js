import axios from 'axios'
import * as Consts from 'Consts';
import { config } from 'Consts';
import { AuthService } from '../OAuth/OAuth';

async function getTree() {
    const response = await axios.post(`${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_GET}`)
    return response.data;
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

async function getDate(){
    const response = await axios.post(`${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETINGS_DATE}`)
    return response.data;
}

async function fetchMeetingList(treeId) {
    let authService = new AuthService();
    
    return await authService.getUser().then(async user => {
        if (user && user.access_token) {
            const header = {
                headers: { Authorization: `Bearer ${user.access_token}` }
            };

            const data = { Id: Number(treeId), DrillDown: false }
            const response = await axios.post(`${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETINGS_ACTION}`, data, header)
            console.log("api call");
            console.log(response.data);
            return response.data;
        }
    })
}

export {
    getTree,
    saveMeeting,
    fetchMeeting,
    getDate,
    fetchMeetingList
}