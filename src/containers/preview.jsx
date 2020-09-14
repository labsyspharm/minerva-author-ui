import React, { Component } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons'

class Preview extends Component {

  constructor(props) {
    super(props);

    this.back = this.back.bind(this);
  }

  back() {
    this.props.onBack();
  }

  render() {
    return (
      <div className="full-height">
        <button className="ui button" onClick={this.back} >
          <FontAwesomeIcon icon={faAngleLeft} size="lg" />&nbsp;
          Back to Author</button>

          <div id="minerva-browser">TODO</div>
      </div>
    );
  }
}

export default Preview;