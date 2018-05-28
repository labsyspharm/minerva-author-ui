import React from "react";
import ReactDOM from "react-dom";

import Repo from "./containers/repo";

// import "./style/bootstrap.min";
import "react-input-range/lib/css/index.css"
import "./style/demo";

ReactDOM.render(
  <div className="Demo">
    <Repo/>
  </div>,
  document.getElementById("minerva")
);

module.hot.accept();
