import React, { Component } from "react";

import SvgArrow from '../components/svgarrow.jsx'

import '../style/imageview';
import styled from 'styled-components';

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

    this.items = [];
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
      const tile_url = url + '/' + uuid + '/render-tile/' + pos + lod + channelPath;
      return tile_url + '?gamma=1';
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
    console.log('Add image at index ', this.state.index);
    viewer.addTiledImage({
      tileSource: makeTileSource(),
      width: img.width / img.height,
      crossOriginPolicy: 'Anonymous', 
      ajaxHeaders: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'Accept': 'image/jpeg'
      },
      loadTilesWithAjax: true,
      success: (evt) => {
        this.items.push(evt.item);
        if (this.items.length >= 3) {
          let prevItem = this.items.shift();
          viewer.world.removeItem(prevItem);
        }
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

    console.log('Creating new OpenSeadragon');
    // Set up openseadragon viewer
    this.viewer = OpenSeadragon({
      collectionMode: false,
      showZoomControl: false,
      showHomeControl: false,
      loadTilesWithAjax: true,
      showFullPageControl: false,
      immediateRender: true,
      // Specific to this project
      id: "ImageView",
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
    const {overlays, arrows} = this.props;
    arrows.forEach((a,i) => {
      const o = a.position;
      const el = "arrow-" + i;
			const elNew = "new-" + el;
			const element = document.getElementById(el);
			let newElement = document.getElementById(elNew);
			if (!newElement) {
				newElement = element.cloneNode(true);
				newElement.id = elNew;
			}
			else {
				newElement.className = element.className;
			}
      const current = viewer.getOverlayById(elNew);
      const xy = new OpenSeadragon.Point(o[0], o[1]);
      if (current) {
        current.update({
          location: xy
        });
      }
      else {
        viewer.addOverlay({
          x: o[0],
          y: o[1],
          element: newElement,
          placement: OpenSeadragon.Placement.CENTER
        });
      }
    })
    // Hide extra arrows
    for (var i = arrows.length; i < 100; i ++) {
      const elNew = "new-arrow-" + i;
      const current = viewer.getOverlayById(elNew);
      const xy = new OpenSeadragon.Point(-1, -1)
      if (current) {
        current.update({
          location: xy
        });
      }
    }

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
    const {arrows} = this.props;

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
        // Use timeout to prevent excessive requests to Minerva tile-render endpoint
        if (this.updateTimeout) {
          clearTimeout(this.updateTimeout);
        }
        this.updateTimeout = setTimeout(() => {
          const pan = viewer.viewport.getCenter();
          const zoom = viewer.viewport.getZoom();
          viewer.uuid = uuid;
          this.addChannels(pan, zoom);
        }, 300);
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
    const arrow_divs = [...Array(arrows.length).keys()].map((o,i) => {
      const el = "arrow-" + i;
      const radius = 122.8 / 2;
      const a = arrows.length > i ? arrows[i] : undefined;
      const angle = a && a.angle !== '' ? a.angle: 60;
      const a_y = radius * Math.sin(angle * Math.PI /180);
      const a_x = radius * Math.cos(angle * Math.PI /180);
      let Transform = styled.div`
        transform: translate(${a_x}px,${a_y}px)rotate(${angle}deg);
      `
			if (a.hide) {
				Transform = styled.div`
					opacity: 0;
				`
			}
      return (
				<Transform key={el} id={el}>
					<SvgArrow></SvgArrow>
				</Transform>
      )
    })

    return (
      <div>
        <div id="ImageView">
        </div>
        <div className="d-none">
          {overlay_divs}
          {arrow_divs}
        </div>
      </div>
    );
  }
}

export default MinervaImageView;
