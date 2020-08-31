import React, { Component } from "react";
import ImportForm from '../components/importform'
import '../style/import';

class Import extends Component {

  render() {
    return (
      <div className="full-height">
        <div>
          <ImportForm onToken={this.props.onToken} onMinervaImage={this.props.onMinervaImage} enableCloudFeatures={this.props.enableCloudFeatures} />
        </div>
      </div>
    );
  }
}

export default Import;
