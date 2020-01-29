import {
    CognitoUserPool,
    AuthenticationDetails,
    CognitoUser,
} from 'amazon-cognito-identity-js';

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

const authenticate = function(username, pass) {

  return pass.then(function(password) {

    const minervaPoolId = 'us-east-1_d3Wusx6qp'; 
    const minervaClientId = 'cvuuuuogh6nmqm8491iiu1lh5';
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
      .then(response => response.getIdToken().getJwtToken());
  });
}

export default authenticate
