import React, { Component } from "react";

import '../style/overlaylist'

/**
 * Make a list of children
 */
const OverlayList = ({ children }) => {

  const listItems = React.Children
    .map(children, (child, id) => (
      <li key={ id } className="overlay-li bg-trans">
        { child }
      </li>
    ));

  return(
    <ul className="">
      { listItems }
    </ul>
  );
}

export default OverlayList;
