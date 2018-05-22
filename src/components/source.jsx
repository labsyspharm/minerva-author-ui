import React, { Component } from "react";
import Channels from "./channels"

/** 
 * @param {Object} source - {url, type, id, channels}.
 */
const Source = ({source}) => {
  const {url, type, id, channels} = source;
  return (
    <ul>
      <a href={url}> Source #{id}</a>
      <span> has: </span>
      <ul>
        <li>
        <span> type: </span>
        <span> {type} </span>
        </li>
        <li>
        <span> channels: </span>
        <Channels ids={channels}/>
        </li>
      </ul>
    </ul>
  );
}


export default Source;
