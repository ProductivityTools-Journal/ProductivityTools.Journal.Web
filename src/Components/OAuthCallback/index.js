import React, { useEffect,useState } from 'react';
import { useLocation } from 'react-router-dom';
import {UserManager } from 'oidc-client'; 

export const Callback = ({auth}) => {

    debugger;
    const location = useLocation();
    
    useEffect(() => {
        var xx=new UserManager();
        // the login redirect has been completed and we call the
        // signinRedirectCallback to fetch the user data
        new UserManager().signinRedirectCallback().then(user => {
          // received the user data so we set it in the app state and push the
          // router to the secure or bookmarked route
         debugger;
          this.props.history.push("index");
        }, ({ message }) => {
          // userManager throws if someone tries to access the route directly or if
          // they refresh on a failed request so we just send them to the app root
        //   if (message && redirectErrors.includes(message)) {
        //     history.push('/');
        //     return;
        //   }
    debugger;
          // for all other errors just display the message in production it would be
          // a good idea to initiate a sign out after a countdown
         // setError(message);
        });
      }, []);
    
      //return error;

    // new Oidc.UserManager().signinRedirectCallback().then(function(){
    //     history.push("Index");
    // }).catch(function (e) {
    //         console.error(e);
    //     });

    // useEffect(() => {
    //     if (/access_token|id_token|error/.test(location.hash)) {
    //         auth.handleAuthentication();
    //     }
    //     else {
    //         throw new Error("Invalid callback URL.")
    //     }
    //})



    return (<h1>loading...</h1>)

}

export default Callback;