import React, { Component } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import FileBrowserModal from "./filebrowsermodal";
import SignIn from "./signin";
import Client from '../MinervaClient';
import "regenerator-runtime/runtime";
import 'semantic-ui-css/semantic.min.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";

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
      showMinervaFields: false,
      imageUuid: '',
      output: ''
    }

    this.handleSubmit = this.handleSubmit.bind(this);
    this.openFileBrowser = this.openFileBrowser.bind(this);
    this.openMarkerBrowser = this.openMarkerBrowser.bind(this);
    this.onFileSelected = this.onFileSelected.bind(this);
    this.onMarkerFileSelected = this.onMarkerFileSelected.bind(this);
    this.onToken = this.onToken.bind(this);
    this.openMinervaImage = this.openMinervaImage.bind(this);
    this.imageUuidChanged = this.imageUuidChanged.bind(this);
    this.outputChanged = this.outputChanged.bind(this);

    this.filePath = React.createRef();
    this.markerPath = React.createRef();
  }

  handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.target);
    let imageUuid = data.get('imageUuid');
    let loadFrom = (imageUuid && imageUuid.length > 0) ? "cloud" : "local";
    data.set('loadFrom', loadFrom);
    data.set('imageUuid', imageUuid);

    this.setState({
      loading: true,
      error: null
    });

    if (loadFrom === "cloud") {
      this.openMinervaImage().then(image => {
        let numChannels = image.channels.length;
        data.set('numChannels', numChannels);
        this.importImage(data).then(() => {
          this.props.onMinervaImage(image);
          this.setState({ loading: false });
        })
      }).catch(err => {
        console.error(err);
        let errObject = JSON.parse(err.message);
        this.setState({ error: errObject.error, loading: false });
      });
    } else {
      this.importImage(data).then(() => {
        this.setState({ loading: false });
      });
    }
  }

  importImage(data) {
    return fetch('http://localhost:2020/api/import', {
      method: 'POST',
      body: data,
    }).then(response => {
      this.setState({ loading: false });
      if (!response.ok) {
        response.json().then(data => {
          console.error(data);
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

  openMinervaImage() {
    return Client.getImageDimensions(this.state.imageUuid).then(res => {
      console.log(res);
      let image = {
        uuid: res.data.image_uuid,
        width: res.data.pixels.SizeX,
        height: res.data.pixels.SizeY,
        channels: res.data.pixels.channels
      };
      return image;
      //this.props.onMinervaImage(image);
    });
  }

  onToken(data) {
    Client.setUser(data.user);
    this.setState({showMinervaFields: true});
    this.props.onToken(data);
  }

  imageUuidChanged(evt) {
    this.setState({imageUuid: evt.target.value});
  }

  outputChanged(evt) {
    this.setState({output: evt.target.value});
  }

  render() {
    const {loading} = this.state;
    let imageHome = this.state.currentFileFolder ? this.state.currentFileFolder : this.state.currentMarkerFolder;
    let markerHome = this.state.currentMarkerFolder ? this.state.currentMarkerFolder : this.state.currentFileFolder;
    return (
      <div className="center-div">
        <SignIn onToken={this.onToken} enableCloudFeatures={this.props.enableCloudFeatures} />
        <img className="minerva-author-logo" src="images/Minerva-Author_HorizLogo_RGB.svg"></img>
        <form className="ui form" onSubmit={this.handleSubmit}>
          <label htmlFor="filepath">Enter path to tiff or dat: </label>
          <br/>
          <div className="ui action input">
            <input ref={this.filePath} className='full-width-input' id="filepath" name="filepath" type="text" />
            <button type="button" onClick={this.openFileBrowser} className="ui button">Browse</button>
            <FileBrowserModal open={this.state.showFileBrowser} close={this.onFileSelected}
              title="Select an image" 
              onFileSelected={this.onFileSelected} 
              filter={["dat", "tif", "tiff", "svs"]}
              home={imageHome}
              />
          </div>
          <br/>
            {this.renderMinervaUuid()}
          <br/>
          <label htmlFor="filepath">Optional marker_name csv: </label>
          <br/>
          <div className="ui action input">
            <input ref={this.markerPath} className='full-width-input' id="csvpath" name="csvpath" type="text" />
            <button type="button" onClick={this.openMarkerBrowser} className="ui button">Browse</button>
            <FileBrowserModal open={this.state.showMarkerBrowser} close={this.onMarkerFileSelected}
              title="Select a marker name csv" 
              onFileSelected={this.onMarkerFileSelected} 
              filter={["csv"]}
              home={markerHome}
              />
          </div>
          <br/>
          <br/>
          <label htmlFor="filepath">Optional output name: </label>
          <br/>
          <input className='full-width-input' id="dataset" name="dataset" type="text" value={this.state.output} onChange={this.outputChanged} />
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

  renderMinervaUuid() {
    if (!this.state.showMinervaFields) {
      return null;
    }
    return (
      <div>
        <br/>
        <label htmlFor="image_uuid">Minerva Cloud image uuid: </label>
        <br/>
        <div className="ui action input">
          <input className='full-width-input' id="imageUuid" name="imageUuid" type="text" value={this.state.imageUuid} onChange={this.imageUuidChanged}/>
        </div>
      </div>
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
          <div class="content">
            <div className="header">{this.state.error}</div>
          </div>
        </div>
      </div>
    );
  }
}

export default ImportForm;
