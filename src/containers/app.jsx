import React, { Component } from "react";

import Repo from "./repo";
import Import from "./import";
import Preview from "./preview";
import LoginPage from "./login";

import Client from '../MinervaClient';
import login from '../login';
import 'semantic-ui-css/semantic.min.css'
import '../style/app.css';

import { CognitoUserPool } from 'amazon-cognito-identity-js';

export function handleFetchErrors(response) {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
}

class AuthorApp extends Component {

  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      preview: false,
      minerva: false,
      signedIn: false,
      rgba: false,
      warning: '',
      url: 'http://localhost:2020/api/u16',
      uuid: null,
      storyUuid: null,
      story: null,
      imageName: null,
      sample_info: {
        'name': '',
        'text': '',
        "rotation":0
      },
      waypoints: [],
      masks: [],
      groups: [],
      channels: [],
      width: 1024,
      height: 1024
    }

    this.onToken = this.onToken.bind(this);
    this.onMinervaImage = this.onMinervaImage.bind(this);
    this.onStoryLoaded = this.onStoryLoaded.bind(this);
    this.onPreview = this.onPreview.bind(this);
    this.onSignout = this.onSignout.bind(this);

    login.configure(this.props.config);
    Client.configure(this.props.config);

    if (this.props.env === 'cloud') {
      this.tryLogin();
    }
  }

  tryLogin() {
    login.storedAuthentication().then(cognitoUser => {
      this.onToken({
        token: cognitoUser.signInUserSession.idToken.jwtToken,
        user: cognitoUser
      });
    }).catch(err => {
      console.debug('No token');
    });
  }

  async getImportResult() {
    return fetch('http://localhost:2020/api/import', {
      headers: {
        'pragma': 'no-cache',
        'cache-control': 'no-store'
      }
    }).then(async res => {
      return res.json();
    });
  }

  async componentDidMount() {
    if (this.props.env === 'local') {
      try {
        setInterval(async () => {
          const { loaded } = this.state;
          if (loaded === false) {
            const import_result = await this.getImportResult();
            const sample_info = import_result.sample_info;

            this.setState({
              sample_info: sample_info || this.state.sample_info,
              waypoints: import_result.waypoints,
              groups: import_result.groups,
              masks: import_result.masks,
              loaded: import_result.loaded,
              channels: import_result.channels,
              tilesize: import_result.tilesize,
              maxLevel: import_result.maxLevel,
              width: import_result.width,
              height: import_result.height,
              rgba: import_result.rgba,
              warning: import_result.warning
            });
          }
        }, 3000);
      } catch (e) {
        console.log(e);
      }
    }
  }

  onToken(data, token) {
    Client.setUser(data.user);
    Client.guest = false;
    Client.warmupRenderTile(4);

    this.setState({ signedIn: true, username: '' });
  }

  onSignout() {
    login.logout();
    this.setState({signedIn: false});
  }

  onStoryLoaded(story) {
    console.log('Story loaded: ', story);
    this.setState({
      sample_info: story.sample_info,
      waypoints: story.waypoints,
      groups: story.groups,
      storyUuid: story.uuid,
      story: story
    });
  }

  onMinervaImage(image, loadedChannelNames) {
    let channels = [];
    if (loadedChannelNames) {
      channels = loadedChannelNames;
      if (loadedChannelNames.length !== image.channels.length) {
        console.error(`Csv has ${loadedChannelNames.length} markers but the image has ${image.channels.length} channels.`);
      }
    } else {
      for (let channel of image.channels) {
        channels.push(channel.Name);
      }
    }
    let rgba = channels.length === 3 || channels.length === 1;
    this.setState({
      loaded: true,
      tilesize: image.tile_size,
      uuid: image.uuid,
      channels: channels,
      width: image.width,
      height: image.height,
      rgba: rgba,
      warning: '',
      imageName: image.name,
      maxLevel: Math.ceil(Math.log2(Math.max(image.width, image.height) / 1024)),
      url: this.props.config.minervaBaseUrl + '/' + this.props.config.minervaStage + '/image',
      image: image
    });
  }

  onPreview(previewOn, story) {
    if (story) {
      this.setState({ story: story});
    }
    this.setState({ preview: previewOn });
  }

  render() {
    const {loaded, width, height, tilesize, maxLevel, rgba, url, uuid, storyUuid, story, imageName} = this.state;
    const {channels, sample_info, waypoints, groups, warning, masks} = this.state;

    if (loaded) {
      let repoClass = this.state.preview ? "repo-div" : "repo-div show";
      let previewClass = !this.state.preview ? "preview-div" : "preview-div show";
        return (
          <div>
            <div className={repoClass}>
            <Repo   env={this.props.env} rgba={rgba}
                    masks={masks} channels={channels} waypoints={waypoints}
                    groups={groups} url={url} uuid={uuid} maxLevel={maxLevel}
                    width={width} height={height} tilesize={tilesize}
                    sample_info={sample_info} warning={warning} storyUuid={storyUuid}
                    imageName={imageName} story={story}
                    onPreview={this.onPreview}
              />
            </div>
            
            <div className={previewClass}>
            { this.state.preview ? 
              <Preview onBack={() => this.onPreview(false)} 
                story={this.state.story}
                image={this.state.image} />
              : null }
            </div>
           </div>
        )

    }
    if (this.props.env === 'local' || this.state.signedIn) {
      return (
        <Import env={this.props.env} 
          onToken={this.onToken} 
          onMinervaImage={this.onMinervaImage} 
          onStoryLoaded={this.onStoryLoaded}
          onSignout={this.onSignout}
          username={this.state.username} />
      );
    } else {
      return (
        <div className="full-height">
          <LoginPage
            onToken={this.onToken}
            allowGuest={false} />
            <footer className="copyright">©2020, Laboratory of Systems Pharmacology. All rights reserved.</footer>
        </div>
      )
    }
  }
}

export default AuthorApp;
