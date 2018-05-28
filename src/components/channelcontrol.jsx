import React, { Component } from "react";
import InputRange from 'react-input-range';

import HuePicker from "./huepicker";

import '../style/channelcontrol'

/**
 * @param {Object} chan
 * @param {function} onRangeChange - update range state
 */
const ChannelControl = ({ id, color, range, minRange, maxRange,
                          handleChange }) => {

  return (
    <div className="ChannelControl row">
      <div className="col-1">
        <HuePicker
          color={ color }
          handleChange={ color => handleChange(id, color, null) }
        />
      </div>
      <div className="col">
        <InputRange
          allowSameValues={ true }
          draggableTrack={ true }
          maxValue={ maxRange }
          minValue={ minRange }
          value={ range }
          onChange={ range => handleChange(id, null, range) } />
      </div>
    </div>
  );
}

export default ChannelControl;
