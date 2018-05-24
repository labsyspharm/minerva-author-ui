import React from "react"
import reactCSS from "reactcss"

import { CustomPicker, SliderPicker } from "react-color"

class HuePicker extends React.Component {

  constructor() {
    super();
    this.state = {
      display: false
    };
  }

  handleClick() {
    this.setState({
      display: !this.state.display
    });
  }

  handleClose() {
    this.setState({
      display: false
    });
  }

  render() {
    const {display} = this.state;
    const {color, change} = this.props;

    const styles = reactCSS({
      "default": {
        pickerOff: {
          position: "absolute",
          display: "flex",
          width: "3em"
        },
        pickerOn: {
          position: "absolute",
          display: "flex",
          width: "100%"
        },
        color: {
          width: "3em",
          height: "2em",
          cursor: "pointer",
          background: `rgba(${ color[0] }, ${ color[1] }, ${ color[2] }, 1)`
        },
        popover: {
          backgroundColor: "white",
          flex: "1 0 300px",
          height: "3em",
          zIndex: "2"
      }
      },
    });

    if (!display) {
      return (
        <span style={ styles.pickerOff }>
          <div style={ styles.color } onClick={ this.handleClick.bind(this) }>
          </div>
        </span>
      )
    }
    return (
      <span style={ styles.pickerOn }>
        <div style={ styles.color } onClick={ this.handleClick.bind(this) }>
        </div>
        <div style={ styles.popover }>
          <SliderPicker color={{
            r: color[0],
            g: color[1],
            b: color[2],
          }}
          onChange={ change }/>
        </div>
      </span>
    )
  }
}

export default HuePicker
