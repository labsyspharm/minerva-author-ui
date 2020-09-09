import React, { Component } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import FileBrowserModal from "./filebrowsermodal";
import SignIn from "./signin";
import Client from '../MinervaClient';
import "regenerator-runtime/runtime";
import 'semantic-ui-css/semantic.min.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import CloudBrowserModal from "./cloudbrowsermodal";
import MarkerCsvParser from "../util/markercsvparser";

class ImportForm extends Component {
  constructor() {
    super();

    this.state = {
      loading: false,
      error: null,
      showFileBrowser: false,
      showMarkerBrowser: false,
      showCloudBrowser: false,
      currentFileFolder: null,
      currentMarkerFolder: null,
      imageUuid: '',
      output: '',
      signedIn: false,
      loadedChannelNames: null,
      markerFilename: null
    }

    this.handleSubmit = this.handleSubmit.bind(this);
    this.openFileBrowser = this.openFileBrowser.bind(this);
    this.openMarkerBrowser = this.openMarkerBrowser.bind(this);
    this.openCloudBrowser = this.openCloudBrowser.bind(this);
    this.onFileSelected = this.onFileSelected.bind(this);
    this.onMarkerFileSelected = this.onMarkerFileSelected.bind(this);
    this.onToken = this.onToken.bind(this);
    this.openMinervaImage = this.openMinervaImage.bind(this);
    this.imageUuidChanged = this.imageUuidChanged.bind(this);
    this.outputChanged = this.outputChanged.bind(this);
    this.onMinervaCloudUuid = this.onMinervaCloudUuid.bind(this);
    this.onSignout = this.onSignout.bind(this);
    this.readMarkerFile = this.readMarkerFile.bind(this);

    this.filePath = React.createRef();
    this.markerPath = React.createRef();

  }

  readMarkerFile(evt) {
    let file = evt.target.files[0];
    let parser = new MarkerCsvParser();
    let onChannels = (channelNames) => {
      this.setState({loadedChannelNames: channelNames, 
        markerFilename: file.name,
        error: null});
    };
    let onError = (err) => {
      console.error(err);
      this.setState({error: 'Invalid marker csv file format.'});
    };
    parser.readMarkerFile(file, onChannels, onError);
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

  openMinervaImage() {
    if (!this.state.imageUuid) {
      this.setState({error: "Image uuid is missing"});
      return;
    }
    let uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!this.state.imageUuid.match(uuidRegex)) {
      this.setState({error: "Image uuid is invalid"});
      return;
    }
    this.setState({loading: true});
    Client.getImageDimensions(this.state.imageUuid).then(res => {
      let image = {
        uuid: res.data.image_uuid,
        width: res.data.pixels.SizeX,
        height: res.data.pixels.SizeY,
        channels: res.data.pixels.channels
      };
      this.setState({loading: false});
      this.props.onMinervaImage(image, this.state.loadedChannelNames);
    }).catch(err => {
      console.error(err);
      let msg = JSON.parse(err.message);
      this.setState({loading: false, error: msg.error});
    });
  }

  onToken(data) {
    Client.setUser(data.user);
    this.setState({signedIn: true});
    this.props.onToken(data);
    console.log("onToken: ", data);
  }

  imageUuidChanged(evt) {
    this.setState({imageUuid: evt.target.value});
  }

  outputChanged(evt) {
    this.setState({output: evt.target.value});
  }

  onMinervaCloudUuid(image) {
    this.setState({showCloudBrowser: false});
    if (image) {
      this.setState({imageUuid: image.uuid});
    }
  }

  onSignout() {
    this.setState({ signedIn: false });
  }

  render() {
    return (
      <div className="center-div">
        <div>
          <img className="minerva-author-logo" src="images/Minerva-Author_HorizLogo_RGB.svg"></img>
        </div>
        {
          this.props.env === 'local' ?
           this.renderLocalFields() :
           this.renderMinervaCloudForm()
        }
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
        </form>
    );
  }

  renderMinervaCloudForm() {
    return (
      <form class="ui form">
         <SignIn onToken={this.onToken} onSignout={this.onSignout} />
        { this.state.signedIn ? 
          <div>
                <label htmlFor="image_uuid">Minerva Cloud image uuid: </label>
                <br/>
                <div className="ui action input">
                  <input className='full-width-input' id="imageUuid" name="imageUuid" type="text" value={this.state.imageUuid} onChange={this.imageUuidChanged}/>
                  <button type="button" onClick={this.openCloudBrowser} className="ui button">Browse</button>
                    <CloudBrowserModal open={this.state.showCloudBrowser} close={this.onMinervaCloudUuid}
                      title="Select an image" 
                      onMinervaCloudUuid={this.onMinervaCloudUuid} 
                      />
                </div>
                <br/>
                <br/>
                <div className="ui">
                  <label htmlFor="markerFile" className="ui icon button">Select marker file
                   &nbsp;<FontAwesomeIcon hidden={!this.state.markerFilename} color="green" icon={faCheckCircle} />
                  </label>
                  <input type="file" id="markerFile" style={{ display: "none" }} onChange={this.readMarkerFile} />
                  <label>
                    {this.state.markerFilename}
                  </label>
                </div>
                <br/><br/>
                <button type="button" className="ui button" onClick={this.openMinervaImage}> Import </button>
                  <ClipLoader animation="border"
                  size={15} color={"#FFFFFF"}
                  loading={this.state.loading}/>
          </div>
        : null }
       

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
          <div class="content">
            <div className="header">{this.state.error}</div>
          </div>
        </div>
      </div>
    );
  }
}

export default ImportForm;
