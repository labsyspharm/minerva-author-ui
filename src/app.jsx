import React from 'react';
import ReactDOM from 'react-dom';

import Repo from './containers/repo';

import './style/bootstrap.min.css';

ReactDOM.render(
  <Repo />,
  document.getElementById('app')
);

module.hot.accept();
