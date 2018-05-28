import React, { Component } from "react";

/**
 * Make a list of children
 */
const ChannelControlList = ({ children, className }) => {

  const listItems = React.Children
    .map(children, (child, id) => (
      <li key={ id } className="list-group-item list-group-item-slider">
        { child }
      </li>
    ));

  return(
    <ul className={ className + " list-group list-group-slider" }>
      { listItems }
    </ul>
  );
}

export default ChannelControlList;
