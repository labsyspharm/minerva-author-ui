import {
  CognitoUserPool,
  AuthenticationDetails,
  CognitoUser,
} from 'amazon-cognito-identity-js';
import MinervaConfig from './config';

class Login {
  authenticateUser(cognitoUser, authenticationDetails) {
    return new Promise(function (resolve, reject) {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: result => resolve(result),
        onFailure: err => reject(err),
        mfaRequired: codeDeliveryDetails => reject(codeDeliveryDetails),
        newPasswordRequired: (fields, required) => reject({ fields, required })
      });
    });
  };

  authenticate(username, password) {

    const minervaPool = this._getUserPool();

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: minervaPool
    });

    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password
    });

    return this.authenticateUser(cognitoUser, authenticationDetails)
      .then(response => {
        return {
          token: response.getIdToken().getJwtToken(),
          user: cognitoUser
        };
      });
  }

  storedAuthentication() {
    const userPool = this._getUserPool();
    return new Promise((resolve, reject) => {
      let cognitoUser = userPool.getCurrentUser();
      if (cognitoUser != null) {
        cognitoUser.getSession((err, session) => {
          if (err) {
            reject(err);
          }
          console.log("session: ", session);
          resolve(cognitoUser);
        });
      } else {
        reject();
      }
    });

  }

  logout() {
    const userPool = this._getUserPool();
    let cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
  }

  _getUserPool() {
    return new CognitoUserPool({
      UserPoolId: MinervaConfig.CognitoUserPoolId,
      ClientId: MinervaConfig.CognitoClientId
    });
  }
}

var login = new Login();

export default login;
