import React from "react"
import reactCSS from "reactcss"

import { CustomPicker, SliderPicker } from "react-color"

class HuePicker extends React.Component {

  constructor() {
    super();
		this.state = {
			display: false,
			color: {
				r: "241",
				g: "112",
				b: "19",
				a: "1",
			},
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

  handleChange(color) {
    this.setState({ color: color.rgb })
  }

	render() {
		const {display, color} = this.state;

    const styles = reactCSS({
      "default": {
        color: {
          width: "3em",
          height: "2em",
          cursor: "pointer",
          background: `rgba(${ this.state.color.r }, ${ this.state.color.g }, ${ this.state.color.b }, ${ this.state.color.a })`
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
			  <span className="HuePicker">
					<div style={ styles.color } className="ColorButton" onClick={
						this.handleClick.bind(this)
					}>
          </div>
				</span>
			)
		}
		return (
			<span className="HuePicker">
        <div style={ styles.color } className="ColorButton" onClick={
          this.handleClick.bind(this)
        }>
				</div>
				<div className="ColorSlider" style={ styles.popover }>
					<SliderPicker color={ color } onChange={ this.handleChange.bind(this) } />
				</div>
			</span>
		)
	}
}

export default HuePicker
