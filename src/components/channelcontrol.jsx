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
    <FontAwesomeIcon icon={faEye}
      color='white'
    />
  )
  if (visible == false) {
    eyeIcon = (
      <FontAwesomeIcon icon={faEyeSlash}
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
        <div className="ui input mini">
        <input type="text" value={label} 
          onChange={ e => handleChange(id, null, null, e.target.value, visible) }
        />
        </div>
			  <span className="nav-item">
			     <a className="btn" onClick={e => {
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
          onChange={ range => handleChange(id, null, range, null, visible) } />
      </div>
    </div>
  );
}

export default ChannelControl;
