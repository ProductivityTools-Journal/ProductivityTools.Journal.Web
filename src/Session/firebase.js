import { initializeApp } from "firebase/app";

import {
    GoogleAuthProvider,
    getAuth,
    signInWithPopup,
    signOut,
} from "firebase/auth";
import { useState } from "react";

const firebaseConfig = {
    apiKey: "AIzaSyCPfDq6Cnxz2OaeumfrCW5BzbhqCmmXeHk",
    authDomain: "ptjournal-b53b0.firebaseapp.com",
    projectId: "ptjournal-b53b0",
    storageBucket: "ptjournal-b53b0.appspot.com",
    messagingSenderId: "126962328042",
    appId: "1:126962328042:web:43a4816cd5644d65ce5293"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
const signInWithGoogle = async () => {
    try {
        debugger;
        Doit();
        const res = await signInWithPopup(auth, googleProvider);
        console.log(res);
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
};

const Doit = () => {
    setInterval(async () => {
        const user = auth.currentUser;
        if (user) await user.getIdToken(true);
        console.log("refresh token")
        console.log(user);
    }, 10 * 60 * 1000);
}

const logout = () => {
    signOut(auth);
};


export {
    auth,
    signInWithGoogle,
    logout,
};