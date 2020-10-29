import React, { Component } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import FileBrowserModal from "./filebrowsermodal";
import "regenerator-runtime/runtime";
import 'semantic-ui-css/semantic.min.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle, faCheckCircle, faAngleLeft, faFileAlt} from "@fortawesome/free-solid-svg-icons";

class ImportForm extends Component {
  constructor() {
    super();

    this.state = {
      loading: false,
      error: null,
      showFileBrowser: false,
      showMarkerBrowser: false,
      currentFileFolder: null,
      currentMarkerFolder: null,
      output: '',
      loadedChannelNames: null,
      markerFilename: null
    }

    this.handleSubmit = this.handleSubmit.bind(this);
    this.openFileBrowser = this.openFileBrowser.bind(this);
    this.openMarkerBrowser = this.openMarkerBrowser.bind(this);
    this.onFileSelected = this.onFileSelected.bind(this);
    this.onMarkerFileSelected = this.onMarkerFileSelected.bind(this);
    this.outputChanged = this.outputChanged.bind(this);

    this.filePath = React.createRef();
    this.markerPath = React.createRef();

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

  openFileBrowser() {
    this.setState({ showFileBrowser: true});
  }

  openMarkerBrowser() {
    this.setState({ showMarkerBrowser: true});
  }

  openCloudBrowser() {
    this.setState({ showCloudBrowser: true});
  }

  onFileSelected(file, folder=null) {
    this.setState({ 
      showFileBrowser: false
    });
    if (file && file.path) {
      this.filePath.current.value = file.path;
      this.setState({
        currentFileFolder: folder
      });
    }
  }

  onMarkerFileSelected(file, folder=null) {
    this.setState({ 
      showMarkerBrowser: false
    });
    if (file && file.path) {
      this.markerPath.current.value = file.path;
      this.setState({
        currentMarkerFolder: folder
      });
    }
  }

  storyUuidChanged(evt) {
    this.setState({storyUuid: evt.target.value});
  }

  outputChanged(evt) {
    this.setState({output: evt.target.value});
  }

  render() {
    return (
      <div>
        { this.renderLocalFields() }
        {this.renderErrors() }
      </div>
    )
  }

  renderLocalFields() {
    const {loading} = this.state;
    let imageHome = this.state.currentFileFolder ? this.state.currentFileFolder : this.state.currentMarkerFolder;
    let markerHome = this.state.currentMarkerFolder ? this.state.currentMarkerFolder : this.state.currentFileFolder;
    return (
      <form className="ui form" onSubmit={this.handleSubmit}>
          <label htmlFor="filepath">Enter path to image or story: </label>
          <div className="field">
          <div className="ui action input">
            <input ref={this.filePath} id="filepath" name="filepath" type="text" />
            <button type="button" onClick={this.openFileBrowser} className="ui button">Browse</button>
            <FileBrowserModal open={this.state.showFileBrowser} close={this.onFileSelected}
              title="Select image or story (tiff, svs, json)" 
              onFileSelected={this.onFileSelected} 
              filter={["dat", "tif", "tiff", "svs", "json"]}
              home={imageHome}
              />
          </div>
          </div>
          <label htmlFor="filepath">Optional marker_name csv: </label>
          <div className="field">
          <div className="ui action input">
            <input ref={this.markerPath} id="csvpath" name="csvpath" type="text" />
            <button type="button" onClick={this.openMarkerBrowser} className="ui button">Browse</button>
            <FileBrowserModal open={this.state.showMarkerBrowser} close={this.onMarkerFileSelected}
              title="Select a marker name csv" 
              onFileSelected={this.onMarkerFileSelected} 
              filter={["csv"]}
              home={markerHome}
              />
          </div>
          </div>
          <label htmlFor="filepath">Optional output name: </label>
          <div className="field">
          <input id="dataset" name="dataset" type="text" value={this.state.output} onChange={this.outputChanged} />
          </div>
          <button className="ui button"> Import </button>
          <ClipLoader animation="border"
            size={15} color={"#FFFFFF"}
            loading={loading}/>
        </form>
    );
  }

  renderErrors() {
    if (!this.state.error) {
      return null;
    }
    return (
      <div className="import-errors">
        <div className="ui icon message">
          <FontAwesomeIcon className="icon" icon={faExclamationCircle} />
          <div className="content">
            <div className="header">{this.state.error}</div>
          </div>
        </div>
      </div>
    );
  }
}

export default ImportForm;
