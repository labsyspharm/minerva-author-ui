import React, { Component } from "react";
import Source from "./source"

/** 
 * @param {Object[]} sources - [{url, type, id, channel}].
 */
const Sources = ({sources}) => {

  const sourceNode = sources.map((source) => {
    return (<Source source={source} key={source.id}/>)
  });

  return (<ul>{sourceNode}</ul>);
}

export default Sources;
