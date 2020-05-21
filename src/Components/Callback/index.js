// import React, { useEffect,useState } from 'react';
// import { useLocation } from 'react-router-dom';

// export const Callback = ({auth}) => {

//     const location = useLocation();
    


//     useEffect(() => {
//         if (/access_token|id_token|error/.test(location.hash)) {
//             auth.handleAuthentication();
//         }
//         else {
//             throw new Error("Invalid callback URL.")
//         }
//     })



//     return (<h1>loading...</h1>)

// }

// export default Callback;