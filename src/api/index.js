// import { CognitoUserPool,
//          CognitoUserAttribute,
//          CognitoUser,
//          AuthenticationDetails } from 'amazon-cognito-identity-js';
// import AWS from 'aws-sdk';

// const region  = 'us-east-1';
// const poolData = {
//     UserPoolId : 'us-east-1_d9h9zgWpx',
//     ClientId : '5m75aiie05v28astdpu2noap6m'
// };
//
// const identityPoolId = 'us-east-1:615f48bb-613f-46de-98b0-6e0b84f707f6';
// const loginBase = 'cognito-idp.us-east-1.amazonaws.com/us-east-1_d9h9zgWpx';
//
// const userPool = new CognitoUserPool(poolData);
//
// const authenticateUser = (cognitoUser, authenticationDetails) => {
//   return new Promise((resolve, reject) => {
//     cognitoUser.authenticateUser(authenticationDetails, {
//       onSuccess: result => resolve(result),
//       onFailure: err => reject(err),
//       mfaRequired: codeDeliveryDetails => reject(codeDeliveryDetails),
//       newPasswordRequired: (fields, required) => reject({fields, required})
//     });
//   });
// };
//
// const setCredentials = token => {
//   return new Promise((resolve, reject) => {
//     const logins = {};
//     logins[loginBase] = token;
//     AWS.config.region = region;
//     AWS.config.credentials = new AWS.CognitoIdentityCredentials({
//       IdentityPoolId: identityPoolId,
//       Logins: logins
//     });
//
//     // Wait for credentials to be configured
//     AWS.config.credentials.get(err => err ? reject(err) : resolve());
//   });
// };
//
// export const login = (email, password) => {
//   const userData = { Username : email, Pool : userPool };
//   const authenticationData = { Username : email, Password : password };
//   const cognitoUser = new CognitoUser(userData);
//   const authenticationDetails = new AuthenticationDetails(authenticationData);
//
//   const token = authenticateUser(cognitoUser, authenticationData)
//     .then(response => response.getIdToken().getJwtToken());
//
//   const credentialsSet = token
//     .then(setCredentials);
//
//   return Promise.all([token, credentialsSet])
//     .then(values => values[0]);
// }

export const login = (email, password) => {
  console.log(email, password);
}

export default {
  login
};
