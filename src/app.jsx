import React from "react";
import ReactDOM from "react-dom";

import Repo from "./containers/repo";
import ChannelControl from "./containers/channelcontrol";

import "./style/bootstrap.min";
import "./style/bootstrap-slider.min";
import "./style/app";

ReactDOM.render(
  <div className="App">
    <Repo/>
    <ChannelControl/>
  </div>,
  document.getElementById("minerva")
);

module.hot.accept();
