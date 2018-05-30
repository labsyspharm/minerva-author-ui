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

const base = 'https://qq3kn9y5te.execute-api.us-east-1.amazonaws.com/dev';

const doFetch = (method, route, token, params = {}) => {
  const headers = new Headers({
    'content-type': 'application/json',
    Authorization: token
  });

  const queryParams = Object.keys(params)
    .map(key => key + '=' + params[key])
    .join('&');

  const url = base + route + (queryParams.length > 0 ? '?' + queryParams : '');

  const request = new Request(
    url,
    {
      method,
      headers,
      mode: 'cors',
      cache: 'no-cache'
    }
  );

  return fetch(request).then(r => r.json());
};

const addImport = (userInput, token) => {
  // Parse user input
  const {repository_name, import_name} = userInput;

  return doFetch('POST', '/repository', token, {
    name: repository_name
  })
  .then(data => data.uuid)
  .then(rep_uuid => {
    console.log('repo uuid ' + rep_uuid);
    return doFetch('POST', '/import', token, {
      repository: rep_uuid,
      name: import_name
    })
  })
  .then(data => data.uuid);
}

const confirmImport = (uuid, token) => {

  const endpoint = '/import/' + uuid + '/complete';
  return doFetch('PUT', endpoint, token);
}

const getImports = (repo, token) => {

  const hack = {
    '43465e43-a8be-4aa3-88af-0db3d9aad6f2': [
       'e6c8cccd-b0cc-4174-aa31-36c6a03a15eb'
    ]
  }
  // TODO fix the hack
  return Promise.all(hack[repo].map(imp => {
    return getImport(imp, token);
  }))

  const endpoint = '/list_imports_in_repository/' + repo;
  return doFetch('GET', endpoint, token)
    .then(data => {

      const {imports} = data;

      // Assume imports is list of uuids
      return Promise.all(imports.map(imp => {
        return api.getImport(imp, token);
      }))
    })
}

const getImages = (imp, token) => {

  const endpointBFU = '/import/' + imp + '/bfus';

  const keyToUrl = key => {
    const parts = key.split('/');
    const path = parts.slice(3).join('/');
    return parts[2] + '.s3.amazonaws.com/' + path;
  }

  return doFetch('GET', endpointBFU, token)
    .then(bfus => {
        return Promise.all(bfus.map(bfu => {
          let endpoint = '/bfu/' + bfu.uuid + '/images';
          return doFetch('GET', endpoint, token)
            .then(images => {
              return images.map(img => {
                return {
                  uuid: img.uuid,
                  url: keyToUrl(img.key),
                  name: img.uuid.split('-')[0]
                };
              });
            });
        }));
    })
    .then(images => [].concat.apply([], images));
}

const getImport = (uuid, token) => {

  const endpoint = '/import/' + uuid;
  return doFetch('GET', endpoint, token)
    .then(data => {
      return {
        uuid: uuid,
        name: data.name
      }
    });
}

const getRepository = (uuid, token) => {

  const endpoint = '/repository/' + uuid;
  return doFetch('GET', endpoint, token);
}

const authenticateUser = (cognitoUser, authenticationDetails) => {

  const handleCode = verification_code => {
    return new Promise((resolve, reject) => {
      reject({
        required: ["new_password"],
        name: "PasswordResetException",
        retry: userInput => {
          // Handle new password
          const {new_password} = userInput;
          return new Promise((resolve, reject) => {
            cognitoUser.confirmPassword(
              verification_code,
              new_password, makeCallbacks(
                () => {},
                reject
              )
            )
          });
        }
      });
    });
  }

  const sendCode = () => {
    return new Promise((resolve, reject) => {
      const notify = e => {
        const {Destination} = e.CodeDeliveryDetails;
        reject({
          message: "Email sent to "+ Destination
        })
      }
      cognitoUser.forgotPassword(
       makeCallbacks(notify, reject)
      );
    });
  }

  const makeCallbacks = (resolve, reject) => {
    return {
      onSuccess: resolve,
      onFailure: err => {
        switch (err.name) {
          case "PasswordResetRequiredException":
            reject({...err,
              required: ["verification_code"],
              retry: userInput => {
                const {verification_code} = userInput;
                if (verification_code) {
                  return handleCode(verification_code);
                }
                return sendCode();
              }
            });
            break;
          default:
            reject(err);
        }
      },
      mfaRequired: codeDeliveryDetails => reject(codeDeliveryDetails),
      newPasswordRequired: (fields, required) => {
        reject({
          name: "PasswordResetException",
          message: "Password Reset Required",
          required: required.concat("new_password"),
          retry: userInput => {
            return new Promise((resolve, reject) => {
              const {new_password} = userInput;

              // Take all new attributes from user
              let userAttributes = {...fields};
              required.forEach((key) => {
                userAttributes[key] = userInput[key];
              })
              delete userAttributes.email_verified;

              // Reattempt the login
              cognitoUser.completeNewPasswordChallenge(
                new_password, userAttributes,
                makeCallbacks(resolve, reject));
            });
          }
        });
      }
    };
  }

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(
      authenticationDetails,
      makeCallbacks(resolve, reject));
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
    .then(response => response.getIdToken().getJwtToken());

  const credentialsSet = token.then(setCredentials);

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

export default {
  login,
  doFetch,
  fetchTile,
  addImport,
  confirmImport,
  getRepository,
  getImport,
  getImports,
  getImages,
};
