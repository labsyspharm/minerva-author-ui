import React from 'react';
import ReactDOM from 'react-dom';

import Repo from './containers/repo';

ReactDOM.render(
  <Repo />,
  document.getElementById('app')
);

module.hot.accept();
