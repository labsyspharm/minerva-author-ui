import React, { Component } from "react";
import InputRange from 'react-input-range';

import HuePicker from "./huepicker";
import {faEye} from "@fortawesome/free-solid-svg-icons";
import {faEyeSlash} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import '../style/channelcontrol'

/**
 * @param {Object} chan
 * @param {function} onRangeChange - update range state
 */
const ChannelControl = ({ id, color, range, minRange, maxRange,
                          label, visible, handleChange }) => {

  let stepSize = Math.ceil((maxRange - minRange) / 100)

  let eyeIcon = (
    <FontAwesomeIcon icon={faEye} size="lg"
      color='white'
    />
  )
  if (visible == false) {
    eyeIcon = (
      <FontAwesomeIcon icon={faEyeSlash} size="lg"
        color='white'
      />
    )
  }
  return (
    <div className="ChannelControl row">
      <div className="col-1">
        <HuePicker
          color={ color }
          handleChange={ color => handleChange(id, color, null, null, visible) }
        />
      </div>
      <div className="col">
        <div className="ui input mini width-75px">
          <input type="text" value={label} 
            onChange={ e => handleChange(id, null, null, e.target.value, visible) }
          />
        </div>
        <div className="ui input mini width-75px">
          <input type="text" value={range.min} 
            onBlur={ e=> {
              let r0 = range.min >= maxRange ? maxRange : range.min;
              let r1 = r0 >= range.max ? Math.min(r0 + 1, maxRange) : range.max;
              handleChange(id, null, {min: r0, max: r1}, null, visible);
            }}
            onChange={ e => {
              let r0 = parseInt(e.target.value);
              r0 = isNaN(r0) ? 0 : r0;
              handleChange(id, null, {min: r0, max: range.max}, null, visible);
            }}
          />
        </div>
        <div className="ui input mini width-75px">
          <input type="text" value={range.max} 
            onBlur={ e=> {
              let r1 = range.max >= maxRange ? maxRange : range.max;
              let r0 = range.min >= r1 ? Math.max(r1 - 1, 0) : range.min;
              handleChange(id, null, {min: r0, max: r1}, null, visible);
            }}
            onChange={ e => {
              let r1 = parseInt(e.target.value);
              r1 = isNaN(r1) ? 0 : r1;
              handleChange(id, null, {min: range.min, max: r1}, null, visible);
            }}
          />
        </div>
			  <span className="nav-item">
			     <a className="btn negative-top-margin" title="Toggle" onClick={e => {
             handleChange(id, null, null, null, !visible);
            }}>
            { eyeIcon }
          </a>
        </span>
        <InputRange
          allowSameValues={ false }
          draggableTrack={ false }
          maxValue={ maxRange }
          minValue={ minRange }
          value={ range }
          step={ stepSize }
          formatLabel={ label => '' }
          onChange={ range => handleChange(id, null, range, null, visible) } />
      </div>
    </div>
  );
}

export default ChannelControl;
