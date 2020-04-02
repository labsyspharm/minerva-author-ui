import React, { Component } from "react";
import InputRange from 'react-input-range';

import HuePicker from "./huepicker";

import '../style/channelcontrol'

/**
 * @param {Object} chan
 * @param {function} onRangeChange - update range state
 */
const ChannelControl = ({ id, color, range, minRange, maxRange,
                          label, handleChange }) => {

  let stepSize = Math.ceil((maxRange - minRange) / 100)

  return (
    <div className="ChannelControl row">
      <div className="col-1">
        <HuePicker
          color={ color }
          handleChange={ color => handleChange(id, color, null, null) }
        />
      </div>
      <div className="col">
        <div className="ui input mini">
        <input type="text" value={label} 
          onChange={ e => handleChange(id, null, null, e.target.value) }
        />
        </div>
        <InputRange
          allowSameValues={ false }
          draggableTrack={ false }
          maxValue={ maxRange }
          minValue={ minRange }
          value={ range }
          step={ stepSize }
          onChange={ range => handleChange(id, null, range, null) } />
      </div>
    </div>
  );
}

export default ChannelControl;
