import React from "react";
import ReactDOM from "react-dom";

import App from "./containers/app";

import "react-input-range/lib/css/index.css";
import "./style/demo";

ReactDOM.render(
  <div className="Demo">
    <div className="Banner"/>
    <App/>
  </div>,
  document.getElementById("minerva")
);

module.hot.accept();
