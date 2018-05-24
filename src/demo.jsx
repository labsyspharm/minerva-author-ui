import React from "react";
import ReactDOM from "react-dom";

import Repo from "./containers/repo";

import "./style/bootstrap.min";
import "./style/bootstrap-slider.min";
import "./style/demo";

ReactDOM.render(
  <div className="Demo">
    <Repo/>
  </div>,
  document.getElementById("minerva")
);

module.hot.accept();
