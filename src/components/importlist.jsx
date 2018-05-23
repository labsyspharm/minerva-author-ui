import React, { Component } from "react";

/** 
 * Make a list of children
 */
const ImportList = params => {

  return(
    <ul>
      {React.Children.map(params.children, (child, id) => {
        return (<li key={id}> {child} </li>);
      })}
    </ul>
  );
}

export default ImportList;
