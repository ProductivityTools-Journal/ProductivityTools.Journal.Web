import {createContext, useEffect,useContext, useState} from 'react'
import {auth} from './firebase'


const AuthContext=createContext({
    user:null
})

export function AuthProvider({children}){
    const [user,setUser]=useState(null)
    const [tokenRefreshTime, setTokenRefreshTime] = useState(() => {
        const stored = localStorage.getItem("tokenRefreshTime");
        return stored ? new Date(stored) : null;
    });

    useEffect(() => {
        //Adds an observer for changes to the signed-in user's ID token, which includes sign-in, sign-out, and token refresh events.
        return auth.onIdTokenChanged(async (user) => {
            if (!user) {
               // console.log("missing user")
                setUser(null);
                setTokenRefreshTime(null);
                localStorage.removeItem("tokenRefreshTime");
            }   
            else {
                const token = await user.getIdToken();
                const now = new Date();
                setUser(user);
                localStorage.setItem("token", token);
                localStorage.setItem("refreshToken", user.refreshToken);
                localStorage.setItem("tokenRefreshTime", now.toISOString());
                setTokenRefreshTime(now);
               // console.log("After getIdToken, onIdTokenChanged method invoked and token in the localstorage updated", token);
            }
        })
    }, []);

    const refreshToken = async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            await currentUser.getIdToken(true);
        }
    };

    return (
        <AuthContext.Provider value={{ user, tokenRefreshTime, refreshToken }}>{children}</AuthContext.Provider>
    )    
}


export const useAuth = () => {
    return useContext(AuthContext);
}