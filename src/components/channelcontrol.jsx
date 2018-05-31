import React, { Component } from "react";
import InputRange from 'react-input-range';
import RangeText from "./rangetext";
import HuePicker from "./huepicker";

import '../style/channelcontrol'

/**
 * @param {function} handleChange - update color and range
 */
const ChannelControl = ({ id, color, range, minRange, maxRange,
                          handleChange }) => {

  // Large steps for text boxes
  var step = Math.ceil((maxRange - minRange) / 255);
  step = (range.max - range.min > step)? step : 1;

  return (
    <div className="row">
      <div className="col-1">
        <HuePicker
          color={ color }
          handleChange={ color => handleChange(id, color, null) }
        />
      </div>
      <div className="ChannelSlider col-11">
        <RangeText
          onChange={val => handleChange(id, null, {
            min: val,
            max: range.max
          })}
          value={range.min} min={minRange} max={range.max - 1}
          step={step} full={[minRange, maxRange]} />
        <InputRange
          allowSameValues={ false }
          draggableTrack={ false }
          maxValue={ maxRange }
          minValue={ minRange }
          value={ range }
          onChange={ range => handleChange(id, null, range) } />
        <RangeText
          onChange={val => handleChange(id, null, {
            min: range.min,
            max: val
          })}
          value={range.max} min={range.min + 1} max={maxRange}
          step={step} full={[minRange, maxRange]} />
      </div>
    </div>
  );
}

export default ChannelControl;
