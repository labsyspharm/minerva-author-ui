import React, { Component } from "react";

class CopyYaml extends Component {

  constructor(props) {
    super();
  
    this.copyText = this.copyText.bind(this);
  }

  copyText() {
    const {text} = this.props;

    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el); 
  }

  render() {
    const {text} = this.props;

    if (text === '') {
      return (<div></div>)
    }

    return (
      <button onClick={this.copyText}>
        Copy YAML
      </button>
    );
  }
}

export default CopyYaml;
