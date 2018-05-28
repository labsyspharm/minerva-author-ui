import React from "react";
import reactCSS from "reactcss";

import { SketchPicker } from "react-color";

class HuePicker extends React.Component {

  constructor() {
    super();
    this.state = {
      displayColorPicker: false
    };

    this.handleClick = this.handleClick.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleClick() {
    this.setState({ displayColorPicker: !this.state.displayColorPicker })
  };

  handleClose() {
    this.setState({ displayColorPicker: false })
  };

  handleChange({ rgb }) {
    const { handleChange } = this.props;
    handleChange([rgb.r, rgb.g, rgb.b]);
  };

  render() {
    const { color:c } = this.props;
    const color = { r: c[0], g: c[1], b: c[2] };

    const styles = reactCSS({
      'default': {
        color: {
          width: '14px',
          height: '14px',
          borderRadius: '2px',
          background: `rgb(${ color.r }, ${ color.g }, ${ color.b })`,
        },
        swatch: {
          padding: '1px',
          background: '#fff',
          borderRadius: '1px',
          boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
          display: 'inline-block',
          cursor: 'pointer',
        },
        popover: {
          position: 'absolute',
          zIndex: '2',
        },
        cover: {
          position: 'fixed',
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px',
        },
      },
    });

    return (
      <div>
        <div className="ColorPickerSwatch" style={ styles.swatch }
             onClick={ this.handleClick }>
          <div style={ styles.color } />
        </div>
        {
          this.state.displayColorPicker
          ? <div className="ColorPickerDialog" style={ styles.popover }>
              <div style={ styles.cover } onClick={ this.handleClose } />
              <SketchPicker color={ color }
                            onChange={ this.handleChange } />
            </div>
          : null
        }

      </div>
    )
  }
}

export default HuePicker
