// import { createContext, useEffect, useContext,useState } from 'react';
// import {auth} from './firebase.js'

//  const AuthContext = createContext({
//      user: null
//  })

// export function AuthProvider({children}) {
//     const [user, setUser] = useState(null);
//     useEffect(() => {
//         return auth.onIdTokenChanged(async (user) => {
//              if (!user) {
//                  console.log("Missing user");
//                  setUser(null);                 
//              }
//              else {
//                  const token = await user.getIdToken();
//                  setUser(user);
//                  console.log("Token")
//                  console.log(token);
//              }
//          })
//     }, []);

//     useEffect(() => {
//         const handle = setInterval(async () => {
//             const user = auth.currentUser;
//             if (user) await user.getIdToken(true);
//             console.log("refresh token")
//         }, 10* 60 * 1000);
//         return () => clearInterval(handle);
//     }, []);

//     return (
//         <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
//     )
// }
// export const useAuth = () => {
//     return useContext(AuthContext);
//   };