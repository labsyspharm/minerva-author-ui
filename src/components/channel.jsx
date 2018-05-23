import React, { Component } from "react";
import ReactBootstrapSlider from 'react-bootstrap-slider';

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
