import React, { Component } from "react";
import ImportForm from '../components/importform'
import '../style/import';

class Import extends Component {

  render() {
    return (
      <div className="full-height">
        <div className="align-center">
          <div>
            <h1 className="font-white">Minerva Author</h1>
          </div>
        </div>
        <div>
          <ImportForm/>
        </div>
      </div>
    );
  }
}

export default Import;
