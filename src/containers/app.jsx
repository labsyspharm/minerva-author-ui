import React, { Component } from "react";

import Repo from "./repo";
import Import from "./import";

import authenticate from '../login';
import 'semantic-ui-css/semantic.min.css'
import MinervaConfig from '../config';

class App extends Component {

  constructor() {
    super();

    this.state = {
      token: '',
      loaded: false,
      minerva: false,
      rgba: false,
      warning: '',
      url: 'http://localhost:2020/api/u16',
      //minerva: true,
			uuid: null,
      //uuid: '0c18ba28-872c-4d83-9904-ecb8b12b514d',
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

  async componentDidMount() {
    const {minerva, url, uuid} = this.state;

    try {
      setInterval(async () => {
        const {loaded} = this.state;
        if (loaded === false) {
          const res = await fetch('http://localhost:2020/api/import');
          const import_result = await res.json();
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
          })
        }
      }, 3000);
    } catch(e) {
      console.log(e);
    }
  }

  onToken(data) {
    this.setState({token: data.token, minerva: true});
  }

  onMinervaImage(image) {
    let channels = [];
    for (let channel of image.channels) {
      channels.push(channel.Name);
    }
    this.setState({
      loaded: true,
      tilesize: 1024,
      uuid: image.uuid,
      channels: channels,
      width: image.width,
      height: image.height,
      maxLevel: Math.ceil(Math.log2(Math.max(image.width, image.height) / 1024)),
      url: MinervaConfig.minervaBaseUrl + '/' + MinervaConfig.minervaStage + '/image'
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
      <Import onToken={this.onToken} onMinervaImage={this.onMinervaImage}/>
    );
  }
}

export default App;
