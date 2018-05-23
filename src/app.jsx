import React from "react";
import ReactDOM from "react-dom";

import Repo from "./containers/repo";
import ChannelControl from "./containers/channelcontrol";

import "bootstrap/dist/css/bootstrap";
import "./style/app.css";

ReactDOM.render(
  <div className="App">
    <Repo/>
    <ChannelControl/>
  </div>,
  document.getElementById("minerva")
);

module.hot.accept();
