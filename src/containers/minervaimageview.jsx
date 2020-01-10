import React, { Component } from "react";

import authenticate from '../login';

import '../style/imageview';

// TODO: use login token from app.jsx
const getAjaxHeaders = function(){
  const user = 'john_hoffer@hms.harvard.edu';
  const pass = Promise.resolve('MEETING@lsp2');
  return authenticate(user, pass).then(function(token){
    return {
      'Content-Type': 'application/json',
      'Authorization': token,
      'Accept': 'image/png'
    };
  });  
};

const IntToHex = c => {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

const rgbToHex = rgb => {
  const [r, g, b] = rgb;
  return IntToHex(r) + IntToHex(g) + IntToHex(b);
}

class MinervaImageView extends Component {

  constructor() {
    super();
  }

  makeTileSource() {
    const {img, channels} = this.props;
    const { url, uuid } = img;

    const channelList = Array.from(channels.values()).map(function(c){
      const specs = [c.id, rgbToHex(c.color), c.range.min / c.maxRange, c.range.max / c.maxRange];
      return specs.join(',');
    })
    const channelPath = channelList.join('/');

		const getTileUrl = function(l, x, y) {
      const lod = (this.maxLevel - l) + '/';
      const pos = x + '/' + y + '/0/0/';
      const tile_url = url + uuid + '/render-tile/' + pos + lod + channelPath;
      console.log(pos + lod)
      return tile_url;
		}

    return {
			// Custom functions
			getTileUrl: getTileUrl,
			// CUstom parameters
      many_channel_range: [0, 1],
      many_channel_color: [255, 255, 255].map(c => c / 255.),
			// Standard parameters
			tileSize: 1024,
			width: img.width,
			height: img.height,
			maxLevel: img.maxLevel,
			minLevel: 0
    }
  }

  addChannels() {
    const {viewer} = this;
    const makeTileSource = this.makeTileSource.bind(this);
    const {img} = this.props;
    getAjaxHeaders().then(function(ajaxHeaders){
      viewer.addTiledImage({
        tileSource: makeTileSource(),
        width: img.width / img.height,
        crossOriginPolicy: 'Anonymous',
        ajaxHeaders: ajaxHeaders,
        loadTilesWithAjax: true
      });
    });
  }

  componentDidMount() {
    const {channels, img, handleViewport} = this.props;
    const ids = [...channels.keys()];

    // Set up openseadragon viewer
    this.viewer = OpenSeadragon({
      collectionMode: false,
      showZoomControl: false,
      showHomeControl: false,
      loadTilesWithAjax: true,
      showFullPageControl: false,
      // Specific to this project
      id: "ImageView",
      compositeOperation: "lighter",
      prefixUrl: "images/openseadragon/"
    });

    this.addChannels();
    const world = this.viewer.world;
    world.addHandler('add-item', function(e) {
      e.item.setWidth(img.width / img.height);
    });

    this.viewer.addHandler('animation-finish', function(e) {
      const THIS = e.userData;
      const viewport = THIS.viewer.viewport;
      handleViewport(viewport);
    }, this);

    this.viewer.uuid = img.uuid;
  }

  render() {
    const {viewer} = this;

    // After first render
    if (viewer !== undefined) {
      const { world } = viewer;
      const { uuid } = this.props.img;
      const { channels } = this.props;
      const ids = new Set(channels.keys());

      if (viewer.uuid != uuid) {
        // Update the whole image
        world.removeAll();
        viewer.uuid = uuid;
        this.addChannels();
      }
    }

    return (<div id="ImageView"></div>);
  }
}

export default MinervaImageView;
