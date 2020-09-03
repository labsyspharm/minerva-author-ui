import React, { Component } from "react";
import ImportForm from '../components/importform'
import '../style/import';

class Import extends Component {

  render() {
    return (
      <div className="full-height">
        <div>
          <ImportForm env={this.props.env} onToken={this.props.onToken} onMinervaImage={this.props.onMinervaImage} />
        </div>
      </div>
    );
  }
}

export default Import;
