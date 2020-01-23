import React, { Component } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import "regenerator-runtime/runtime";

class ImportForm extends Component {
  constructor() {
    super();

    this.state = {
      loading: false
    }

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.target);

    this.setState({
      loading: true
    })
    
    fetch('http://localhost:2020/api/import', {
      method: 'POST',
      body: data,
    });
  }

  render() {
    const {loading} = this.state;
    return (
      <div className="center-div">
        <form onSubmit={this.handleSubmit}>
          <label htmlFor="filepath">Enter csv path: </label>
          <input id="csvpath" name="csvpath" type="text" />
          <br/>
          <label htmlFor="filepath">Enter path to tiff: </label>
          <input id="filepath" name="filepath" type="text" />

          <button> Import </button>
          <ClipLoader animation="border"
          size={15} color={"#FFFFFF"}
          loading={loading}/>
        </form>
      </div>
    );
  }
}

export default ImportForm;
