import React, { Component } from "react";
import {getSliderIds} from "../functions/slider";

/** 
 * @param {Object} channel
 */
const Channel = ({channel}) => {
  const {id, color, range} = channel;
  const {sliderId, minId, maxId} = getSliderIds(id);

  return (
    <div>
      <div>
        <span id={minId}>0</span>
        <span id={maxId}>1</span>
      </div>
      <input id={sliderId} type="text"
        data-slider-min="0" data-slider-max="1"
        data-slider-step="0.01" data-slider-value="0.1"
      />
    </div>
  );
}

export default Channel;
