import React, { Component } from "react";

import authenticate from '../login';

import '../style/imageview';

const IntToHex = c => {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

const rgbToHex = rgb => {
  const [r, g, b] = rgb;
  return IntToHex(r) + IntToHex(g) + IntToHex(b);
}

const differSet = (a, b) => [...a].filter(i => !b.has(i));
const intersectSet = (a, b) => [...a].filter(b.has.bind(b));

class MinervaImageView extends Component {

  constructor() {
    super();

    this.state = {
      old_channels: new Map([])
    }
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
      return tile_url;
		}

    return {
			// Custom functions
			getTileUrl: getTileUrl,
			// Standard parameters
			tileSize: 1024,
			width: img.width,
			height: img.height,
			maxLevel: img.maxLevel,
			minLevel: 0
    }
  }

  addChannels(pan, zoom) {
    const {viewer} = this;
    const makeTileSource = this.makeTileSource.bind(this);
    const {img, token, channels} = this.props;
    viewer.addTiledImage({
      tileSource: makeTileSource(),
      width: img.width / img.height,
      crossOriginPolicy: 'Anonymous',
      ajaxHeaders: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'Accept': 'image/png'
      },
      loadTilesWithAjax: true,
      success: function() {
        viewer.viewport.panTo(pan, true);
        viewer.viewport.zoomTo(zoom, true);
      }
    });
    this.setState({
      old_channels: channels
    })
  }

  componentDidMount() {
    const {channels, img, handleViewport} = this.props;
    const {interactor} = this.props;
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
    interactor(this.viewer);

    const pan = this.viewer.viewport.getCenter();
    const zoom = this.viewer.viewport.getZoom();
    this.addChannels(pan, zoom);
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

  componentDidUpdate() {
    const {viewer} = this;
    const {overlays} = this.props;
    overlays.forEach((o,i) => {
      const el = "overlay-" + i;
      const current = viewer.getOverlayById(el);
      const xy = new OpenSeadragon.Point(o[0], o[1]);
      if (current) {
        current.update({
          location: xy,
          width: o[2],
          height: o[3]
        });
      }
      else {
        viewer.addOverlay({
          x: o[0],
          y: o[1],
          width: o[2],
          height: o[3],
          element: el
        });
      }
    })
    // Hide extra overlays
    for (var i = overlays.length; i < 100; i ++) {
      const el = "overlay-" + i;
      const current = viewer.getOverlayById(el);
      const xy = new OpenSeadragon.Point(-1, -1)
      if (current) {
        current.update({
          location: xy,
          width: 0.001,
          height: 0.001
        });
      }
    }
    const {viewport} = viewer;
    const tinyzoom = 1.00000001;
    viewport.zoomTo(viewport.getZoom()*tinyzoom);
  }

  render() {
    const {viewer} = this;

    // After first render
    if (viewer !== undefined) {
      const { world } = viewer;
      const { uuid } = this.props.img;
      const { channels } = this.props;
      const { old_channels } = this.state;
      const ids = new Set(channels.keys());
      const old_ids = new Set(old_channels.keys())
      const redrawn = intersectSet(ids, old_ids);
      const removed = differSet(old_ids, ids);
      const added = differSet(ids, old_ids);
      const changed = redrawn.filter(id => {
        const old_channel = old_channels.get(id);
        const channel = channels.get(id);
        return (
          old_channel.range.min != channel.range.min ||
          old_channel.range.max != channel.range.max ||
          old_channel.color[0] != channel.color[0] ||
          old_channel.color[1] != channel.color[1] ||
          old_channel.color[2] != channel.color[2]
        )
      })

      if (viewer.uuid != uuid || removed.length || added.length
          || changed.length) {
        // Update the whole image
        const pan = viewer.viewport.getCenter();
        const zoom = viewer.viewport.getZoom();
        world.removeAll();
        viewer.uuid = uuid;
        this.addChannels(pan, zoom);
      }
    }

    const overlay_divs = [...Array(100).keys()].map((o,i) => {
      const el = "overlay-" + i;
      return (
        <div className="white-overlay"
             key={el} id={el}>
        </div>
      )
    })
    return (
      <div>
        {overlay_divs}
        <div id="ImageView">
        </div>
      </div>
    );
  }
}

export default MinervaImageView;
