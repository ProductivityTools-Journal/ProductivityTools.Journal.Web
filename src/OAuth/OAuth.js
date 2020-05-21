import { Log, User, UserManager } from 'oidc-client';
import * as Consts from 'Consts';

export class AuthService{
    constructor(){
        const settings = {
            authority: Consts.stsAuthority,
            client_id: Consts.clientId,
            redirect_uri: `${Consts.clientRoot}signin-callback.html`,
            silent_redirect_uri: `${Consts.clientRoot}silent-renew.html`,
            // tslint:disable-next-line:object-literal-sort-keys
            post_logout_redirect_uri: `${Consts.clientRoot}`,
            response_type: 'id_token token',
            scope: Consts.clientScope
          };
          this.userManager = new UserManager(settings);
      
          Log.logger = console;
          Log.level = Log.INFO;
    }
    

     getUser=()=> {
        return this.userManager.getUser();
    }
    
     login=()=> {
        return this.userManager.signinRedirect();
    }
    
       renewToken=()=> {
        return this.userManager.signinSilent();
    }
    
       logout=()=>{
        return this.userManager.signoutRedirect();
    }
}