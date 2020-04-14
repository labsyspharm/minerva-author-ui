import {
    CognitoUserPool,
    AuthenticationDetails,
    CognitoUser,
} from 'amazon-cognito-identity-js';
import MinervaConfig from './config';

const authenticateUser = function(cognitoUser, authenticationDetails) {
  return new Promise(function(resolve, reject) {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: result => resolve(result),
      onFailure: err => reject(err),
      mfaRequired: codeDeliveryDetails => reject(codeDeliveryDetails),
      newPasswordRequired: (fields, required) => reject({fields, required})
    });
  });
};

const authenticate = function(username, password) {

    const minervaPoolId = MinervaConfig.CognitoUserPoolId;
    const minervaClientId = MinervaConfig.CognitoClientId;
    const minervaPool = new CognitoUserPool({
      UserPoolId : minervaPoolId,
      ClientId : minervaClientId
    });

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: minervaPool
    });

    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password
    });

    return authenticateUser(cognitoUser, authenticationDetails)
      .then(response => {
        return {
          token: response.getIdToken().getJwtToken(),
          user: cognitoUser
        };
      });
}

export default authenticate;
