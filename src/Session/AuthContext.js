import {createContext, useEffect,useContext, useState} from 'react'
import {auth} from './firebase'
import {toast} from 'react-toastify'


const AuthContext=createContext({
    user:null
})

export function AuthProvider({children}){
    const [user,setUser]=useState(null)

    useEffect(() => {
        //Adds an observer for changes to the signed-in user's ID token, which includes sign-in, sign-out, and token refresh events.
        return auth.onIdTokenChanged(async (user) => {
            if (!user) {
               // console.log("missing user")
                setUser(null)
            }   
            else {
                const token = await user.getIdToken();
                setUser(user);
                localStorage.setItem("token", token);
                localStorage.setItem("refreshToken", user.refreshToken);
               // console.log("After getIdToken, onIdTokenChanged method invoked and token in the localstorage updated", token);
                toast("New token saved in local storage")
            }
        })
    }, []);

    
    useEffect(() => {
        const minutes=4;
        const interval=minutes * 60 * 1000;
        
        const handle = setInterval(async () => {
            const user = auth.currentUser;
            if (user) {
              //  console.log("Auth Context, setInterval invoked, getIdToken o user performed");
                toast(minutes + ' min passed and token refresh invoked')
                //true - force refresh
                await user.getIdToken(true);
                //console.log(user);
            }
        }, interval);
        return () => clearInterval(handle);
    }, [])

    return (
        <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
    )    
}


export const useAuth = () => {
    return useContext(AuthContext);
}