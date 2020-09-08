import React, { Component } from "react";

import Repo from "./repo";
import Import from "./import";

import Client from '../MinervaClient';
import login from '../login';
import 'semantic-ui-css/semantic.min.css'

class AuthorApp extends Component {

  constructor(props) {
    super(props);

    this.state = {
      token: 'Anonymous',
      loaded: false,
      minerva: false,
      rgba: false,
      warning: '',
      url: 'http://localhost:2020/api/u16',
			uuid: null,
      sample_info: {
        'name': '',
        'text': '',
        "rotation":0
      },
      waypoints: [],
      groups: [],
      channels: [],
      width: 1024,
      height: 1024
    }

    this.onToken = this.onToken.bind(this);
    this.onMinervaImage = this.onMinervaImage.bind(this);

    login.configure(this.props.config);
    Client.configure(this.props.config);

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
    const {minerva, url, uuid} = this.state;

    if (this.props.env === 'local') {
      try {
        setInterval(async () => {
          const {loaded} = this.state;
          if (loaded === false) {
            const import_result = await this.getImportResult();
            const sample_info = import_result.sample_info;

            this.setState({
              sample_info: sample_info || this.state.sample_info,
              waypoints: import_result.waypoints,
              groups: import_result.groups,
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
      } catch(e) {
        console.log(e);
      }
    }
  }

  onToken(data) {
    this.setState({token: data.token });
    Client.guest = false;
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
    this.setState({
      loaded: true,
      tilesize: 1024,
      uuid: image.uuid,
      channels: channels,
      width: image.width,
      height: image.height,
      rgba: false,
      warning: '',
      sample_info: {
        'name': '',
        'text': '',
        "rotation": 0
      },
      waypoints: [],
      groups: [],
      maxLevel: Math.ceil(Math.log2(Math.max(image.width, image.height) / 1024)),
      url: this.props.config.minervaBaseUrl + '/' + this.props.config.minervaStage + '/image'
    });
  }

  render() {
    const {token, loaded, width, height, tilesize, maxLevel, rgba, url, uuid} = this.state;
    const {channels, sample_info, waypoints, groups, warning} = this.state;

    if (loaded) {
      return (<Repo env={this.props.env} token={token} rgba={rgba}
                    channels={channels} waypoints={waypoints}
                    groups={groups} url={url} uuid={uuid} maxLevel={maxLevel}
                    width={width} height={height} tilesize={tilesize}
                    sample_info={sample_info} warning={warning}
                     />
      )
    }
    return (
      <Import env={this.props.env} onToken={this.onToken} onMinervaImage={this.onMinervaImage} />
    );
  }
}

export default AuthorApp;
