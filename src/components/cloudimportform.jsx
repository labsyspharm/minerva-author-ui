import React from 'react';
import CloudBrowserModal from "./cloudbrowsermodal";
import SignIn from '../components/signin';
import Client from '../MinervaClient';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle, faCheckCircle, faAngleLeft, faFileAlt} from "@fortawesome/free-solid-svg-icons";
import MarkerCsvParser from "../util/markercsvparser";
import Loader from "../components/loader";

export default class CloudImportForm extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      showCloudBrowser: false,
      stories: [],
      imageUuid: ''
    }

    this.onToken = this.onToken.bind(this);
    this.imageUuidChanged = this.imageUuidChanged.bind(this);
    this.onSignout = this.onSignout.bind(this);
    this.openCloudBrowser = this.openCloudBrowser.bind(this);
    this.onMinervaCloudUuid = this.onMinervaCloudUuid.bind(this);
  }

  componentDidMount() {
    this.loadStoryList();
  }

  readMarkerFile(evt) {
    let file = evt.target.files[0];
    let parser = new MarkerCsvParser();
    let onChannels = (channelNames) => {
      this.setState({
        loadedChannelNames: channelNames,
        markerFilename: file.name,
        error: null
      });
    };
    let onError = (err) => {
      console.error(err);
      this.setState({ error: 'Invalid marker csv file format.' });
    };
    parser.readMarkerFile(file, onChannels, onError);
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
    let uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!imageUuid.match(uuidRegex)) {
      this.setState({ error: "Image uuid is invalid" });
      return;
    }
    this.setState({ loading: true });

    Client.getImageDimensions(imageUuid).then(res => {
      console.log(res);
      let image = res.included.images[0];
      image.width = res.data.pixels.SizeX;
      image.height = res.data.pixels.SizeY;
      image.channels = res.data.pixels.channels;
      this.setState({ loading: false });
      this.props.onMinervaImage(image, this.state.loadedChannelNames);
    }).catch(err => {
      console.error(err);
      let msg = JSON.parse(err.message);
      this.setState({ loading: false, error: msg.error });
    });
  }

  loadStoryList() {
    Client.listStories().then(data => {
      console.log(data);
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
      console.error(err);
    });
  }

  imageUuidChanged(evt) {
    this.setState({imageUuid: evt.target.value});
  }

  onToken(data) {
    Client.setUser(data.user);
    this.setState({signedIn: true});
    this.props.onToken(data);
    this.loadStoryList();

    const urlParams = new URLSearchParams(window.location.search);
    const storyUuid = urlParams.get('story');
    if (storyUuid) {
      this.loadCloudStory(storyUuid);
    }
  }

  onSignout() {
    this.setState({ signedIn: false });
  }

  render() {
    return (
      <div>
        {!this.state.signedIn ?
          <h4 className="ui large dividing header purple">Sign in</h4>
          : null
        }
        <SignIn onToken={this.onToken} onSignout={this.onSignout} />
        {this.state.signedIn ?
          <div>
            {this.renderCreateCloudStory()}
            <br /><br />
            {this.renderStoryList()}
          </div>
          : null}
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
            <label htmlFor="markerFile" style={{ color: "#333333" }} className="ui icon button">Select marker file
             &nbsp;<FontAwesomeIcon hidden={!this.state.markerFilename} color="green" icon={faCheckCircle} />
            </label>
            <input type="file" accept=".csv" id="markerFile" style={{ display: "none" }} onChange={this.readMarkerFile} />
            <label>
              {this.state.markerFilename}
            </label>
          </div>
          <br />
          <button type="button" className="ui button" onClick={() => this.openMinervaImage(this.state.imageUuid)}>Import</button>
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
      <div>
        <h4 className="ui large dividing header purple">Load an existing story</h4>
        <div className="ui relaxed divided list inverted minerva-storylist">
          {list}
        </div>
      </div>
    );
  }
}