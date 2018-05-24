import React, { Component } from "react";

import viaWebGL from 'viawebgl';

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
  }

  makeTileSource(entry) {
    const {imageOptions} = this.props;
    const [id, channelcontrol] = entry;
    const {color, range} = channelcontrol;

    var output = {
      many_channel_id: id,
      many_channel_range: range,
      many_channel_color: map(color, c => c / 255.),
      many_channel_active: selected
    }

    return TileSourceOptions(channel, source_url, source_type, is_active, aws_creds);
  }

  makeTileSources() {
    const {channelMap} = this.props;
    const entries = channelMap.entries();

    return Array.from(entries).map(readSouurce);
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
