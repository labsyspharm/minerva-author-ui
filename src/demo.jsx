import React from "react";
import ReactDOM from "react-dom";

import App from "./containers/app";

ReactDOM.render(
  <App>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    Ut facilisis, neque non sagittis vulputate, ipsum lectus consectetur tortor, quis tristique massa magna vitae purus.
    Nam ultrices magna vitae hendrerit aliquet.
    Etiam ac risus efficitur, gravida diam id, placerat massa.
    Nunc auctor tortor.
  </App>,
  document.getElementById("react-output")
);

module.hot.accept();
