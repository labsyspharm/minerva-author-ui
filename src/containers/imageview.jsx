import React, { Component } from "react";

import viaWebGL from 'viawebgl';
import AmazonWebSource from '../amazonwebsource'

class ImageView extends Component {

  constructor() {
    super();
    this.state = {
      defaults: {
        rows: 1,
        opacity: 1.0,
        tileSize: 1024,
        tileMargin: -1024,
        compositeOperation: "lighter",
        prefixUrl: "images/openseadragon/"
      }
    }
		console.log(process.env);
  }

  makeTileSource(entry) {
    const [id, channelcontrol] = entry;
    const {imageOptions} = this.props;
    const {color, range} = channelcontrol;

    var output = {
      many_channel_id: id,
      many_channel_range: range,
      many_channel_color: map(color, c => c / 255.)
    }

    // Many channels in tiled image
    output.getTileUrl = getTileUrl;
    output.many_channel_url = url;
    output.tileSize = 1024;
    output.height = 4080;
    output.width = 7220;
    output.minLevel = 0;
    output.maxLevel = 3;

    // Make AWS request
    var aws = new AmazonWebSource(credentials);
    output.makeAjaxRequest = aws.makeAjaxRequest; 

    return output
  }

  makeTileSources() {
    const {channelMap} = this.props;
    const entries = channelMap.entries();

    return Array.from(entries).map(this.makeTileSource);
  }

  componentDidMount() {
    const {defaults} = this.state;
    var tileSources = this.makeTileSources();

    // Set up openseadragon viewer
    var viewer = viaWebGL.OpenSeadragon({
      debugMode: false,
      collectionMode: true,
      id: "many-channel-viewer",
      showZoomControl: false,
      showHomeControl: false,
      showFullPageControl: false,
      loadTilesWithAjax: true,

      opacity: defaults.opacity,
      collectionRows: defaults.rows,
      prefixUrl: defaults.prefixUrl,
      collectionTileSize: defaults.tileSize,
      collectionTileMargin: defaults.tileMargin,
      compositeOperation: defaults.compositeOperation,

      tileSources: tileSources
    });

  }

  render() {
    const {imageOptions, channelMap} = this.props;
    const entries = channelMap.entries();

    return (
      <div id="many-channel-viewer"></div>
    );
  }
}

export default ImageView;
