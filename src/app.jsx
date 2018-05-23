import React from 'react';
import ReactDOM from 'react-dom';

import Repo from './containers/repo';
import ChannelControl from './containers/channelcontrol';

import './style/bootstrap.min.css';
import './style/app.css';

ReactDOM.render(
  <div className="App">
    <Repo/>
    <ChannelControl/>
  </div>,
  document.getElementById("minerva")
);

module.hot.accept();
