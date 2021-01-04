import 'bootstrap/dist/css/bootstrap.css';
import 'babel-core/register';
import 'babel-polyfill';

import React from "react";
import ReactDOM from "react-dom";

import AuthorApp from "./containers/app";

import "react-input-range/lib/css/index.css";
import "./style/demo";

console.log(process.env.MINERVA_AUTHOR_ENV);

let minervaConfig = {
  "region": "us-east-1",
  "minervaBaseUrl": "",
  "minervaStage": "dev",
  "CognitoUserPoolId": "us-east-1_YuTF9ST4J",
  "CognitoClientId": "6ctsnjjglmtna2q5fgtrjug47k"
}

ReactDOM.render(
  <div className="Demo">
    <div className="Banner"/>
    <AuthorApp env={process.env.MINERVA_AUTHOR_ENV} config={minervaConfig} />
  </div>,
  document.getElementById("minerva")
);

module.hot.accept();
