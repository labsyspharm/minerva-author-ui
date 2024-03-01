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
      session: null,
      imageFile: '',
      markerFile: '',
      outputSaveFile: '',
      inputFile: '',
      rgba: false,
      warning: '',
      url: 'http://localhost:2020/api/u16',
      uuid: null,
      storyUuid: null,
      story: null,
      imageName: null,
      sampleInfo: {
        'name': '',
        'text': '',
        "rotation":0
      },
      has_auto_groups: false,
      original_groups: [],
      defaults: [],
      waypoints: [],
      masks: [],
      groups: [],
      channels: [],
      width: 1024,
      height: 1024
    }

    this.onToken = this.onToken.bind(this);
    this.importCallback = this.importCallback.bind(this);
    this.onMinervaImage = this.onMinervaImage.bind(this);
    this.onStoryLoaded = this.onStoryLoaded.bind(this);
    this.onPreview = this.onPreview.bind(this);
    this.onSignout = this.onSignout.bind(this);
    this.updateInputFile = this.updateInputFile.bind(this);

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

  importCallback(import_result) {
    const { loaded } = this.state;
    if (loaded === false) {
      const {output_save_file, input_image_file} = import_result;
      const {sample_info, marker_csv_file} = import_result;

      const original_groups = import_result.groups;
      const has_auto_groups = import_result.has_auto_groups;

      // Restrict automated groups
      if (has_auto_groups && original_groups.length) {
        const channels = original_groups[0].channels;
        import_result.groups = [{
          ...original_groups[0],
          channels: channels.slice(0,2),
          label: 'Overview'
        }];
      }

      this.setState({
        outputSaveFile: output_save_file || this.state.outputSaveFile,
        sampleInfo: sample_info || this.state.sampleInfo,
        imageFile: input_image_file,
        markerFile: marker_csv_file,
        waypoints: import_result.waypoints,
        defaults: import_result.defaults || [],
        has_auto_groups: !!has_auto_groups,
        original_groups: original_groups,
        first_viewport: import_result.first_viewport,
        first_group: import_result.first_group,
        groups: import_result.groups,
        masks: import_result.masks,
        loaded: import_result.loaded,
        channels: import_result.channels,
        tilesize: import_result.tilesize,
        maxLevel: import_result.maxLevel,
        width: import_result.width,
        height: import_result.height,
        rgba: import_result.rgba,
        warning: import_result.warning,
        session: import_result.session,
        out_name: import_result.out_name,
        root_dir: import_result.root_dir
      });
    }
  }

  updateInputFile(filename) {
    this.setState({
      inputFile: filename
    });
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
      sampleInfo: story.sample_info,
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
    const {channels, sampleInfo, waypoints, groups, warning, masks, defaults} = this.state;
    const { first_group, first_viewport } = this.state;
    const {inputFile, outputSaveFile} = this.state;
    const {imageFile, markerFile} = this.state;
    const {out_name, root_dir, session} = this.state;

    if (loaded) {
      let repoClass = this.state.preview ? "repo-div" : "repo-div show";
      let previewClass = !this.state.preview ? "preview-div" : "preview-div show";
        return (
          <div>
            <div className={repoClass}>
            <Repo   env={this.props.env} rgba={rgba}
                    imageFile={imageFile} markerFile={markerFile}
                    inputFile={inputFile} outputSaveFile={outputSaveFile}
                    masks={masks} channels={channels} waypoints={waypoints}
                    groups={groups} url={url} uuid={uuid} maxLevel={maxLevel}
                    width={width} height={height} tilesize={tilesize}
                    sampleInfo={sampleInfo} warning={warning} storyUuid={storyUuid}
                    imageName={imageName} story={story} defaults={defaults}
                    first_viewport={first_viewport} first_group={first_group}
                    has_auto_groups={this.state.has_auto_groups}
                    original_groups={this.state.original_groups}
                    onPreview={this.onPreview}
                    out_name={out_name}
                    root_dir={root_dir}
                    session={session}
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
          username={this.state.username}
          updateInputFile={this.updateInputFile}
          importCallback={this.importCallback}
        />
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
