/*
Configuration file for the Minerva author client Cloud features
*/

var MinervaConfig = {
    enableCloudFeatures: false,
    region: "us-east-1",
    // Url for the Minerva API Gateway (without stage) 
    minervaBaseUrl: "",
    // Stage name for the Minerva API Gateway (e.g. dev, test, prod)
    minervaStage: "",
    CognitoUserPoolId: "",
    CognitoClientId: ""
}

export default MinervaConfig;