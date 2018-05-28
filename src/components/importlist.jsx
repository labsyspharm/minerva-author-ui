import React, { Component } from "react";
import "../style/ImportList";

/**
 * Make a list of children
 */
const ImportList = ({ children, className }) => {

  return(
    <ul className={ className }>
      {React.Children.map(children, (child, id) => {
        return (<li key={id}> {child} </li>);
      })}
    </ul>
  );
}

export default ImportList;
