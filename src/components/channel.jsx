import React, { Component } from "react";

import RangeText from "./rangetext";
import HuePicker from "./huepicker";
import Slider from "react-bootstrap-slider";

import '../style/channel'

/** 
 * @param {Object} channel
 * @param {function} onRangeChange - update range state
 */
const Channel = ({channel, onRangeChange, onColorChange}) => {
  const {id, color, range} = channel;
  const [min, max] = range.map(v => {
    return Math.round(100 * v);
  });
	const full = [0, 100];
	const step = 1;

  return (
    <div className="Channel">
      <HuePicker
        color={color}
        change={color => {
          const {r, g, b} = color.rgb;
          onColorChange([r, g, b]);
        }}
      />
      <form className="RangeForm">
        <RangeText
        onChange={val => onRangeChange([val, max])}
        value={min} min={full[0]} max={max - 1}
        step={step} full={full}/>
        <Slider
          value={[min, max]}
          tooltip="hide"
          change={e => onRangeChange(e.target.value)}
          step={step}
          min={full[0]}
          max={full[1]}
        />
        <RangeText
        onChange={val => onRangeChange([min, val])}
        value={max} min={min + 1} max={full[1]}
        step={step} full={full}/>
      </form>
    </div>
  );
}

export default Channel;
