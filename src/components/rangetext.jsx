import React, { Component } from "react";

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
      new_shown_value = '' + new_value; 
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

    const {value, min, max, step} = this.props;
    const shown_value = this.showValue(value);

    return (
      <input type="text"
      onChange={e => this.updateValue(e.target.value)}
      onKeyDown={e => {
        switch (e.key) {
          case "ArrowUp":
            this.updateValue(value + step);
            break;
          case "ArrowDown":
            this.updateValue(value - step);
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
