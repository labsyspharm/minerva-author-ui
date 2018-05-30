import React, { Component } from "react";

const toCapital = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

class ModalText extends Component {
 
  render() {

    const {field, value, onChange} = this.props;
    const name = toCapital(field).replace("_", " ");
    const type = (() => {
      if (field.indexOf('password') >= 0) {
        return "password";
      }
      return "text";
    })();

    return (
      <input className="form-control" type={type}
        value={value} placeholder={name}
        onChange={onChange} />
    );
  }
}

export default ModalText;
