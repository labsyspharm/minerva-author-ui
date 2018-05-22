import React, { Component } from "react";
import Channel from "./channel"

/** 
 * @param {number[]} ids - channels for given source.
 */
const Channels = ({ids}) => {

  const channelNode = ids.map((id) => {
    return (<Channel id={id} key={id}/>)
  });

  return (<ul>{channelNode}</ul>);
}

export default Channels;
