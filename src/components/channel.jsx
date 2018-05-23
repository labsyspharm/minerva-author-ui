import React, { Component } from "react";
import Slider from "react-bootstrap-slider";

/** 
 * @param {Object} channel
 */
const Channel = ({channel}) => {
  const {id, color, range} = channel;

  return (
    <div>
      <span>0</span>
      <span>
      <Slider
        value={range}
        change={() => {}}
        step={0.01}
        min={0}
        max={1}
      />
      </span>
      <span>1</span>
    </div>
  );
}

export default Channel;
