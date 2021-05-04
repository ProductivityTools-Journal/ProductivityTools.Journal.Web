import axios from 'axios'
import * as Consts from 'Consts';

async function getTree(){

    const response=await axios.post(`${Consts.PATH_BASE}${Consts.PATH_TREE_CONTROLER}/${Consts.PATH_TREE_GET}`)
    return response.data;
}



export {
    getTree
}