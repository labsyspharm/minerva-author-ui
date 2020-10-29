import React from 'react';
import CloudBrowserModal from "./cloudbrowsermodal";
import Client from '../MinervaClient';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt, faCheckCircle, faFileAlt} from "@fortawesome/free-solid-svg-icons";
import MarkerCsvParser from "../util/markercsvparser";
import Loader from "../components/loader";
import ErrorFooter from "../components/errorfooter";

export default class CloudImportForm extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      showCloudBrowser: false,
      stories: [],
      imageUuid: ''
    }

    this.imageUuidChanged = this.imageUuidChanged.bind(this);
    this.openCloudBrowser = this.openCloudBrowser.bind(this);
    this.onMinervaCloudUuid = this.onMinervaCloudUuid.bind(this);
    this.readMarkerFile = this.readMarkerFile.bind(this);
  }

  componentDidMount() {
    const urlParams = new URLSearchParams(window.location.search);
    const storyUuid = urlParams.get('story');
    if (storyUuid) {
      this.loadCloudStory(storyUuid);
    }
    const imageUuid = urlParams.get('image');
    if (imageUuid) {
      this.openMinervaImage(imageUuid);
    } else {
      this.loadStoryList();
    }
  }

  readMarkerFile(evt) {
    let file = evt.target.files[0];
    let parser = new MarkerCsvParser();
    let onError = function(err) {
      console.error(err);
      this.setState({ error: 'Invalid marker csv file format.' });
    };
    onError = onError.bind(this);

    let onChannels = function(channelNames) {
      this.setState({
        loadedChannelNames: channelNames,
        markerFilename: file.name,
        error: ''
      });
    };
    onChannels = onChannels.bind(this);

    parser.readMarkerFile(file, onChannels, onError);
  }

  onChannels() {
    
  }

  openCloudBrowser() {
    this.setState({ showCloudBrowser: true });
  }

  onMinervaCloudUuid(image) {
    this.setState({ showCloudBrowser: false });
    if (image) {
      this.setState({ imageUuid: image.uuid });
    }
  }

  onMarkerFileSelected(file, folder = null) {
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

  openMinervaImage(imageUuid) {
    if (!imageUuid) {
      this.setState({ error: "Image uuid is missing" });
      return;
    }
    imageUuid = imageUuid.trim();
    let uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!imageUuid.match(uuidRegex)) {
      this.setState({ error: "Image uuid is invalid" });
      return;
    }
    this.setState({ loading: true });

    Client.getImageDimensions(imageUuid).then(res => {
      let image = res.included.images[0];
      image.width = res.data.pixels.SizeX;
      image.height = res.data.pixels.SizeY;
      image.channels = res.data.pixels.channels;
      this.setState({ loading: false });
      this.props.onMinervaImage(image, this.state.loadedChannelNames);
    }).catch(err => {
      let errorText = '';
      if (err.status === 403) {
        errorText = 'Image not found, or you don\'t have permission to view the image.';
      } else {
        console.error(err);
        let msg = JSON.parse(err.message);
        errorText = msg.error;
      }
      this.setState({ loading: false, error: errorText });
    });
  }

  loadStoryList() {
    Client.listStories().then(data => {
      let stories = data.stories;
      stories.sort((a, b) => {
        if (a.last_updated < b.last_updated) {
          return -1;
        }
        if (a.last_updated > b.last_updated) {
          return 1;
        }
        return 0;
      });
      this.setState({ stories: stories });
    }).catch(err => {
      console.error(err);
    });
  }

  loadCloudStory(uuid) {
    if (!uuid) {
      return;
    }
    this.setState({ loading: true });
    Client.getStory(uuid).then(story => {
      console.log(story);
      this.props.onStoryLoaded(story);
      this.openMinervaImage(story.imageUuid);
    }).catch(err => {
      this.setState({ loading: false, error: 'Error in opening story' });
      console.error(err);
    });
  }

  imageUuidChanged(evt) {
    this.setState({imageUuid: evt.target.value});
  }

  render() {
    return (
      <div className="cloud-import-form-div">
          { this.renderCreateCloudStory() }
          { this.renderStoryList() }
          { this.renderLogoutFields() }
          <ErrorFooter message={this.state.error} />
      </div>
    );
  }

  renderCreateCloudStory() {
    return (
      <form className="ui form inverted">
        <h4 className="ui large dividing header purple">Create a new story</h4>
        <div className="field">
          <label>Minerva Cloud image uuid: </label>
          <div className="ui action input">
            <input className='full-width-input' id="imageUuid" name="imageUuid" type="text" value={this.state.imageUuid} onChange={this.imageUuidChanged} />
            <button type="button" onClick={this.openCloudBrowser} className="ui button">Browse</button>
            <CloudBrowserModal open={this.state.showCloudBrowser} close={this.onMinervaCloudUuid}
              title="Select an image"
              onMinervaCloudUuid={this.onMinervaCloudUuid}
            />
          </div>
        </div>
        <div className="field">
          <div className="ui">
            <label htmlFor="markerFile" style={{ color: "#333333" }} className="ui icon button cloud-form-button">Select marker file
            </label>
            <input type="file" accept=".csv" id="markerFile" style={{ display: "none" }} onChange={this.readMarkerFile} />
            <label>
              {this.state.markerFilename} &nbsp;
              <FontAwesomeIcon hidden={!this.state.markerFilename} color="#016936" icon={faCheckCircle} size="lg" />
            </label>
          </div>
          <br />
          <button type="button" className="ui button cloud-form-button" onClick={() => this.openMinervaImage(this.state.imageUuid)}>Import</button>          
          <Loader active={this.state.loading} />
        </div>
      </form>
    );
  }

  renderStoryList() {
    if (!this.state.stories) {
      return null;
    }
    let list = this.state.stories.map(story => {
      let name = story.sample_info.name || 'Unnamed story';
      let uuid = story.uuid;
      return (
        <div className="item" key={story.uuid}>
          <i className="icon middle aligned"><FontAwesomeIcon icon={faFileAlt} size="lg" inverse /></i>
          <div className="content">
            <a className="header" onClick={() => this.loadCloudStory(uuid)}>{name}</a>
            <div className="description">Image: {story.image_name} &mdash; Author: {story.author_name}</div>
          </div>
        </div>
      );
    });
    return (
      <div className="cloud-import-storylist">
        <h4 className="ui large dividing header purple">Load an existing story</h4>
        <div className="ui relaxed divided list inverted minerva-storylist">
          {list}
        </div>
      </div>
    );
  }

  renderLogoutFields() {
    return (
        <div className="signout-button">
        <div className="ui black button" disabled={this.state.loading}
        onClick={this.props.onSignout}>
            <span className="visible content">
              <FontAwesomeIcon icon={faSignOutAlt} size="lg" />&nbsp;Sign out
            </span>

        </div>
        </div>
    );
  }

}
