import React, { Component } from "react";
import ImportForm from '../components/importform'
import '../style/import';

class Import extends Component {

  render() {
    return (
      <div className="full-height">
        <ImportForm/>
      </div>
    );
  }
}

export default Import;
