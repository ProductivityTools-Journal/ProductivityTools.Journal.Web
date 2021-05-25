import axios from 'axios'
import * as Consts from 'Consts';
import {config} from 'Consts';

async function getTree(){

    const response=await axios.post(`${config.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_GET}`)
    return response.data;
}

async function saveMeeting(meeting){

    debugger;
    const response=await axios.post(`${config.PATH_BASE}${Consts.PATH_MEETINGS_CONTROLER}/${Consts.PATH_MEETING_NEW_MEETING}`,meeting)
    return response.data;
}



export {
    getTree,
    saveMeeting
}