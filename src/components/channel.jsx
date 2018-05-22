import React, { Component } from "react";

/** 
 * @param {number} id - which channel.
 */
const Channel = ({id}) => {

  const channels = {
    1001: { min: 0, max: 1, color: "FF0000" },
    1002: { min: 0.05, max: 0.1, color: "00FF00" },
    2001: { min: 0.9, max: 1.0, color: "FFFFFF" }
  };

  const el = channels[id];

  return (
    <li key={id}>
      {el.min} {el.max} {el.color}
    </li>
  );
}

export default Channel;
