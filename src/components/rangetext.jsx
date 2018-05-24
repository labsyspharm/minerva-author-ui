import React, { Component } from "react";
import Slider from "react-bootstrap-slider";

class RangeText extends Component {

  constructor({value, onChange}) {
    super();
    this.state = {
      shown_value: undefined
    };
  }

  showValue(value) {
    const {shown_value} = this.state;
    if (shown_value !== undefined) {
      return shown_value;
    }
    return value;
  }

  updateValue(user_value) {

    const {min, max, onChange} = this.props;

    const int_value = parseInt(user_value);
    var new_shown_value = '';
    var new_value;

    // Input Validation
    if (!isNaN(int_value)) {
      new_value = Math.min(Math.max(int_value, min), max); 
      new_shown_value = '' + Math.min(Math.max(int_value, 0), 100); 
      // Show the real value if within range
      if (new_value == int_value) {
        new_shown_value = undefined;
      }
      // Update the state
      onChange(new_value);
    }

    this.setState({
      shown_value: new_shown_value
    });
  }
  
  /** 
   * @param {number} value
   * @param {function} onChange - update value state
   */
  render() {

    const {value, min, max} = this.props;
    const shown_value = this.showValue(value);

    return (
      <input type="text"
      onChange={e => this.updateValue(e.target.value)}
      onKeyDown={e => {
        switch (e.key) {
          case "ArrowUp":
            this.updateValue(value + 1);
            break;
          case "ArrowDown":
            this.updateValue(value - 1);
            break;
        }
      }}
      onBlur={(e => {
        this.setState({
          shown_value: undefined
        });
      })}
      value={shown_value}/>
    );
  }
}

export default RangeText;
