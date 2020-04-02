import React, { Component } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import "regenerator-runtime/runtime";
import 'semantic-ui-css/semantic.min.css'

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
      loading: true,
      error: null
    });
    
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
        <form className="ui form" onSubmit={this.handleSubmit}>
          <label htmlFor="filepath">Enter path to tiff: </label>
          <input className='full-width-input' id="filepath" name="filepath" type="text" />
          <br/>
          <br/>
          <label htmlFor="filepath">Optional marker_name csv: </label>
          <input className='full-width-input' id="csvpath" name="csvpath" type="text" />
          <br/>
          <br/>
          <button className="ui button"> Import </button>
          <ClipLoader animation="border"
          size={15} color={"#FFFFFF"}
          loading={loading}/>
          <br/>
          <br/>
          { this.renderErrors() }
        </form>
        
      </div>
    );
  }

  renderErrors() {
    if (!this.state.error) {
      return null;
    }
    return (
      <div className="ui label red below">
        {this.state.error}
      </div>
    );
  }
}

export default ImportForm;
