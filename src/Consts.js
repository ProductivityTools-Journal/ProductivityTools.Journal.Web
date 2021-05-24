//export const PATH_BASE='http://192.168.1.51:8081/api/	';
export const PATH_MEETINGS_CONTROLER = 'Meetings';
export const PATH_MEETINGS_ACTION = 'List';
export const PATH_MEETINGS_DATE = 'Date';
export const PATH_MEETING_ACTION = 'Meeting';
export const PATH_MEETING_UPDATE_MEETING= 'Update';
export const PATH_MEETING_NEW_MEETING= 'New';

export const PATH_TREE_CONTROLER = 'Tree';
export const PATH_TREE_GET= 'Get';

//export const stsAuthority = 'http://192.168.0.51:8083/';


export const clientScope = 'openid profile ProductivityTools.Meetings.API';


const dev={
    clientId:"devmeetingsweb",
    PATH_BASE :'http://localhost:5002/api/',
    stsAuthority : 'https://identityserver.productivitytools.tech:8084/',
    clientRoot : 'http://localhost:3000/',
 //   apiRoot : 'http://localhost:5002/'
}


const prod={
    clientId:"prodmeetingsweb",
    PATH_BASE :'https://meetings.productivitytools.tech:8081/api/',
    stsAuthority : 'https://identityserver.productivitytools.tech:8084/',
    clientRoot : 'https://meetingsweb.z13.web.core.windows.net/',
  //  apiRoot : 'http://localhost:5002/'
}

export const config = process.env.NODE_ENV === 'development' ? dev : prod;