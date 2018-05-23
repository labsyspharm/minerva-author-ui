import React, { Component } from "react";

/**
 * Make a list of children
 */
const ImageList = params => {

  return(
    <ul>
      {React.Children.map(params.children, (child, id) => {
        return (<li key={id}> {child} </li>);
      })}
    </ul>
  );
}

export default ImageList;
