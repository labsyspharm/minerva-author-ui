import React, { Component } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import "regenerator-runtime/runtime";

class ImportForm extends Component {
  constructor() {
    super();

    this.state = {
      loading: false,
      error: null
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
    }).then(response => {
      this.setState({ loading: false });
      if (!response.ok) {
        response.json().then(data => {
          this.setState({ error: data.error}); 
        });
      }
    }).catch(err => {
      this.setState({ loading: false, error: err });
      console.error(err);
    });
  }

  render() {
    const {loading} = this.state;
    return (
      <div className="center-div">
        <form onSubmit={this.handleSubmit}>
          <label htmlFor="filepath">Enter path to tiff: </label>
          <input className='full-width-input' id="filepath" name="filepath" type="text" />
          <br/>
          <br/>
          <label htmlFor="filepath">Optional marker_name csv: </label>
          <input className='full-width-input' id="csvpath" name="csvpath" type="text" />
          <br/>
          <br/>
          <button> Import </button>
          <ClipLoader animation="border"
          size={15} color={"#FFFFFF"}
          loading={loading}/>
        </form>
        { this.renderErrors() }
      </div>
    );
  }

  renderErrors() {
    if (!this.state.error) {
      return null;
    }
    return (
      <p className="import-errors">
        {this.state.error}
      </p>
    );
  }
}

export default ImportForm;
