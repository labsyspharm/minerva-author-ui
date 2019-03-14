import React, { Component } from "react";

class ImportForm extends Component {
  constructor() {
    super();
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.target);
    
    fetch('/api/import', {
      method: 'POST',
      body: data,
    });
  }

  render() {
    return (
      <div className="center-div">
        <form onSubmit={this.handleSubmit}>
          <label htmlFor="filepath">Enter path to tiff: </label>
          <input id="filepath" name="filepath" type="text" />

          <button>Import</button>
        </form>
      </div>
    );
  }
}

export default ImportForm;
