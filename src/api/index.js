import { CognitoUserPool,
         CognitoUserAttribute,
         CognitoUser,
         AuthenticationDetails } from 'amazon-cognito-identity-js';
import AWS from 'aws-sdk';

const region  = 'us-east-1';
const poolData = {
    UserPoolId : 'us-east-1_d9h9zgWpx',
    ClientId : '5m75aiie05v28astdpu2noap6m'
};

const identityPoolId = 'us-east-1:615f48bb-613f-46de-98b0-6e0b84f707f6';
const loginBase = 'cognito-idp.us-east-1.amazonaws.com/us-east-1_d9h9zgWpx';

const userPool = new CognitoUserPool(poolData);

const authenticateUser = (cognitoUser, authenticationDetails) => {
  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: result => resolve(result),
      onFailure: err => reject(err),
      mfaRequired: codeDeliveryDetails => reject(codeDeliveryDetails),
      newPasswordRequired: (fields, required) => reject({fields, required})
    });
  });
};

const setCredentials = token => {
  return new Promise((resolve, reject) => {
    const logins = {};
    logins[loginBase] = token;
    AWS.config.region = region;
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: identityPoolId,
      Logins: logins
    });

    // Wait for credentials to be configured
    AWS.config.credentials.get(err => err ? reject(err) : resolve());
  });
};

const getAttributes = cognitoUser => {
  return new Promise((resolve, reject) => {
    cognitoUser.getUserAttributes((err, result) => {
      if (err) { reject(err); }
      else { resolve(result); }
    })
  })
};

export const login = (email, password) => {
  const userData = { Username : email, Pool : userPool };
  const authenticationData = { Username : email, Password : password };
  const cognitoUser = new CognitoUser(userData);
  const authenticationDetails = new AuthenticationDetails(authenticationData);

  const token = authenticateUser(cognitoUser, authenticationDetails)
    .then(response => {
      console.log(response);
      return response;
    })
    .then(response => response.getIdToken().getJwtToken());

  const credentialsSet = token;
    // .then(setCredentials);

  const gotAttrs = token
    .then(() => getAttributes(cognitoUser))
    .then(attrs => {
      const obj = {};
      attrs.map(attr => {
        obj[attr['Name']] = attr['Value']
      })
      return obj;
    });

  return Promise.all([token, credentialsSet, gotAttrs])
    .then(values => {
      console.log(gotAttrs);
      return values;
    })
    .then(values => ({
      token: values[0],
      attrs: values[2]
    }));
}

export const fetchTile = credentialsHolder => options => {

    // // Wait for credentials
    // const getCredentials = () => {
    //   return new Promise((resolve, reject) => {
    //     AWS.config.credentials.get(err => err ? reject(err) : resolve());
    //   });
    // };

    const getObject = (bucket, key) => {
      return new Promise((resolve, reject) => {
        const s3 = new AWS.S3({ credentials: credentialsHolder.credentials });
        const params = { Bucket: bucket, Key: key };
        s3.getObject(params, (err, data) => err ? reject(err) : resolve(data));
      });
    };

    // Split the URL into bucket and key
    var no_protocol = options.url.split('://')[1] || options.url;
    var [bucket, key] = no_protocol.split('.s3.amazonaws.com/');
    if (key === undefined) {
      var first_slash = no_protocol.indexOf('/');
      bucket = no_protocol.slice(0, first_slash);
      key = no_protocol.slice(first_slash + 1);
    }

    getObject(bucket, key)
      .then(obj => options.success({response: obj.Body}))
      .catch(err => console.error(err));
};



// export const login = (email, password) => {
//   console.log(email, password);
// }

export default {
  login,
  fetchTile
};
