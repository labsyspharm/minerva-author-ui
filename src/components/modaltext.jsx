import React, { Component } from "react";

const toCapital = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

class ModalText extends Component {
 
  render() {

    const {field, value, onChange} = this.props;
    const name = toCapital(field).replace("_", " ");

    return (
      <div className="form-group">
        <label> {name}: </label>
        <input type="text" value={value}
          onChange={onChange} />
      </div>
    );
  }
}

export default ModalText;
