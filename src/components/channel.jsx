import React, { Component } from "react";

/** 
 * @param {Object} channel
 */
const Channel = ({channel}) => {
  const {id, color, range} = channel;

  return (
    <span>
    {id} {color} {range[0]} {range[1]}
    </span>
  );
}

export default Channel;
