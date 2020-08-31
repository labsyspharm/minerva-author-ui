import React, { Component } from "react";

import Repo from "./repo";
import Import from "./import";

import authenticate from '../login';
import Client from '../MinervaClient';
import login from '../login';
import 'semantic-ui-css/semantic.min.css'
//import MinervaConfig from '../config';

class App extends Component {

  constructor() {
    super();

    this.state = {
      token: '',
      config: {
        enableCloudFeatures: false
      },
      loaded: false,
      minerva: false,
      rgba: false,
      warning: '',
      url: 'http://localhost:2020/api/u16',
      //minerva: true,
			uuid: null,
      sample_info: {
        'name': '',
        'text': ''
      },
      waypoints: [],
      groups: [],
      channels: [],
      width: 1024,
      height: 1024
    }

    this.onToken = this.onToken.bind(this);
    this.onMinervaImage = this.onMinervaImage.bind(this);

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

    this.getConfiguration();

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
            warning: import_result.warning,
            uuid: import_result.imageUuid
          });

        }
      }, 3000);
    } catch(e) {
      console.log(e);
    }
  }

  getConfiguration() {
    fetch('http://localhost:2020/api/configuration').then(res => {
      res.json().then(config => {
        login.configure(config);
        Client.configure(config);
        this.setState({ config: config});
        this.setState({ url: config.minervaBaseUrl + '/' + config.minervaStage + '/image' });
      })
    });
  }

  onToken(data) {
    this.setState({token: data.token, minerva: true});
    Client.guest = false;
  }

  onMinervaImage(image) {
    let minervaCloudChannels = [];
    for (let channel of image.channels) {
      minervaCloudChannels.push(channel.Name);
    }

    this.getImportResult().then(result => {

      let channels = minervaCloudChannels;
      // If the user gave a custom channel names csv, replace Minerva Cloud's provided channel names
      if (result.channels[0] !== '0') {
        channels = result.channels;
      }

      this.setState({
        loaded: true,
        tilesize: 1024,
        uuid: image.uuid,
        channels: channels,
        width: image.width,
        height: image.height,
        maxLevel: Math.ceil(Math.log2(Math.max(image.width, image.height) / 1024))
      });
    });
  }

  render() {
    const {token, loaded, width, height, tilesize, maxLevel, rgba, minerva, url, uuid} = this.state;
    const {channels, sample_info, waypoints, groups, warning} = this.state;

    if (loaded) {
      return (<Repo token={token} minerva={minerva} rgba={rgba}
                    channels={channels} waypoints={waypoints}
                    groups={groups} url={url} uuid={uuid} maxLevel={maxLevel}
                    width={width} height={height} tilesize={tilesize}
                    sample_info={sample_info} warning={warning}/>
      )
    }
    return (
      <Import onToken={this.onToken} onMinervaImage={this.onMinervaImage} enableCloudFeatures={this.state.config.enableCloudFeatures}/>
    );
  }
}

export default App;
