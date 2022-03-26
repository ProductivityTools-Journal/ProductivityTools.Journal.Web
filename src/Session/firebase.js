import { initializeApp } from "firebase/app";

import {
    GoogleAuthProvider,
    getAuth,
    signInWithPopup,
    signOut,
} from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyD1llzZnvhtKeb-O7GVbILicQPSENW9cJs",
    authDomain: "ptlearning-95d51.firebaseapp.com",
    projectId: "ptlearning-95d51",
    storageBucket: "ptlearning-95d51.appspot.com",
    messagingSenderId: "337424818554",
    appId: "1:337424818554:web:1699a98eedb7ce46a776c3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
const signInWithGoogle = async () => {
    try {
        debugger;
        const res = await signInWithPopup(auth, googleProvider);
        console.log(res);
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
};

const logout = () => {
    signOut(auth);
    
};


export {
    auth,
    signInWithGoogle,
    logout,
};