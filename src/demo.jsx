import 'bootstrap/dist/css/bootstrap.css';

import React from "react";
import ReactDOM from "react-dom";

import AuthorApp from "./containers/app";

import "react-input-range/lib/css/index.css";
import "./style/demo";

let minervaConfig = {
  "region": "us-east-1",
  "minervaBaseUrl": "https://nldzj7hd69.execute-api.us-east-1.amazonaws.com",
  "minervaStage": "dev",
  "CognitoUserPoolId": "us-east-1_YuTF9ST4J",
  "CognitoClientId": "6ctsnjjglmtna2q5fgtrjug47k"
}

ReactDOM.render(
  <div className="Demo">
    <div className="Banner"/>
    <AuthorApp env={'cloud'} config={minervaConfig} />
  </div>,
  document.getElementById("minerva")
);

module.hot.accept();
