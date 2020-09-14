import {
  CognitoUserPool,
  AuthenticationDetails,
  CognitoUser,
} from 'amazon-cognito-identity-js';

class Login {

  configure(config) {
    this.userPool = new CognitoUserPool({
      UserPoolId: config.CognitoUserPoolId,
      ClientId: config.CognitoClientId
    });
  }

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

    const minervaPool = this.userPool;

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
    return new Promise((resolve, reject) => {
      let cognitoUser = this.userPool.getCurrentUser();
      if (cognitoUser != null) {
        cognitoUser.getSession((err, session) => {
          if (err) {
            reject(err);
          }
          resolve(cognitoUser);
        });
      } else {
        reject();
      }
    });

  }

  logout() {
    let cognitoUser = this.userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
  }

}

var login = new Login();

export default login;
