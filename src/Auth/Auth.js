import auth0 from 'auth0-js'

export default class Auth {
    constructor(history) {
        this.history = history;
        this.auth0 = new auth0.WebAuth({
            domain: process.env.REACT_APP_AUTH0_DOMAIN,
            clientID: process.env.REACT_APP_AUTH0_CLIENTID,
            redirectUri: process.env.REACT_APP_AUTH0_CALLBACK_URL,
            responseType: "token id_token",
            scope: "openid profile email"
        })
    }

    login = () => {
        this.auth0.authorize();
    }

    logout = () => {
        
        localStorage.removeItem("access_token");
        localStorage.removeItem("id_token");
        localStorage.removeItem("expires_at");
        this.auth0.logout({
            clientID:process.env.REACT_APP_AUTH0_CLIENTID,
            returnTo:process.env.REACT_APP_AUTH0_CALLBACK_LOGOUTRETURN
        })
    }

    handleAuthentication = () => {
        this.auth0.parseHash((err, authResult) => {
            if (authResult && authResult.accessToken && authResult.idToken) {
                this.setSession(authResult);
                this.history.push("/");
            } else if (err) {
                this.history.push("/");
                alert(`Error: ${err.Error}. Check the console for more details`);
                console.log(err);
            }
        })
    }

    setSession = authResult => {
        debugger;
        const expiresAt = JSON.stringify(authResult.expiresIn * 1000 + new Date().getTime())

        localStorage.setItem("access_token", authResult.accessToken);
        localStorage.setItem("id_token", authResult.idToken);
        localStorage.setItem("expires_at", expiresAt);
    }

    isAuthenticated() {

        const expiresAt = JSON.parse(localStorage.getItem("expires_at"));
        return new Date().getTime() < expiresAt;
    }
    
    getAccessToken=()=>{
        const accessToken=localStorage.getItem("access_token");
        if (!accessToken){
            throw new Error("No access token found");
        }
        return accessToken;
    }
}