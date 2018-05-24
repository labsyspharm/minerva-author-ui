import React from "react";
import ReactDOM from "react-dom";

import Repo from "./containers/repo";
import ChannelControls from "./containers/channelcontrols";

import "./style/bootstrap.min";
import "./style/bootstrap-slider.min";
import "./style/demo";

ReactDOM.render(
  <div className="Demo">
    <Repo/>
    <ChannelControls/>
  </div>,
  document.getElementById("minerva")
);

module.hot.accept();
