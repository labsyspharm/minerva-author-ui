import React, { Component } from "react";

import viaWebGL from 'viawebgl';
import SvgArrow from '../components/svgarrow.jsx'

import '../style/imageview';
import styled from 'styled-components';

const differSet = (a, b) => [...a].filter(i => !b.has(i));
const intersectSet = (a, b) => [...a].filter(b.has.bind(b));

class ImageView extends Component {

  constructor() {
    super();
  }

  makeTileSource(id) {
    const {img, channels} = this.props;

    const channel = channels.get(id);
    if (channel === undefined) {
      return undefined;
    }

    const { color, range, maxRange } = channel;
    const { url } = img;

		const getTileName = (x, y, level, channel) => {
			return channel + "/" + level + "_" + x + "_" + y + ".png";
		}

		const getTileUrl = function(l, x, y) {
			const level = this.maxLevel - l;
			const url = this.many_channel_url;
			const channel = this.many_channel_id;

			const name = getTileName(x, y, level, channel);
			return url + '/' + name;
		}

    return {
			// Custom functions
			getTileUrl: getTileUrl,
			// CUstom parameters
      many_channel_id: id,
			many_channel_url: url,
      many_channel_range: [range['min'] / maxRange, range['max'] / maxRange],
      many_channel_color: color.map(c => c / 255.),
			// Standard parameters
			tileSize: img.tilesize,
			maxLevel: img.maxLevel,
			height: img.height,
			width: img.width,
      minLevel: 0,
    }
  }

  makeTileSources(ids) {
    return ids.map(this.makeTileSource, this)
              .filter(s => s !== undefined);
  }

  getTiledImageIds() {
    const {world} = this.viewer;
    const itemCount = world.getItemCount();

    return [...Array(itemCount).keys()].map(i => {
      const tiledImage = world.getItemAt(i);
      const {many_channel_id} = tiledImage.source;
      return many_channel_id;
    });
  }

  getTiledImageById(id) {
    const { world } = this.viewer;
    const itemCount = world.getItemCount();

    for (let i in [...Array(itemCount).keys()]) {
      const tiledImage = world.getItemAt(i);
      const { many_channel_id } = tiledImage.source;

      if (id == many_channel_id)
        return tiledImage;
    }
  }

  redrawChannels(ids) {
    const { world } = this.viewer;
    const { channels } = this.props;

    // Update each channel's tiledImage
    const values = [...channels.values()];
    values.map(this.setChannel, this);
  }

  addChannels(ids) {
    const {viewer} = this;
    const {img} = this.props;
    const tileSources = this.makeTileSources(ids);
    tileSources.map(tileSource => {
      viewer.addTiledImage({
        tileSource: tileSource,
        width: img.width / img.height
      });
    });
  }

  setChannel(channel) {
    const { id, color, range, maxRange } = channel;
    var tiledImage = this.getTiledImageById(id);
    if (tiledImage === undefined) {
      return;
    }
    let {source} = tiledImage;
    tiledImage._needsDraw = true;

    source.many_channel_color = color.map(c => c / 255.);
    source.many_channel_range = [range['min'] / maxRange,
                                 range['max'] / maxRange];
  }

  getChannel(id) {
    var tiledImage = this.getTiledImageById(id);
    if (tiledImage === undefined) {
      return undefined;
    }
    let {source} = tiledImage;
    return {
      id: id,
      range: source.many_channel_range,
      color: source.many_channel_color.map(c => Math.round(c * 255))
    }
  }

  componentDidMount() {
    const {channels, img, handleViewport} = this.props;
    const {interactor} = this.props;
    const ids = [...channels.keys()];

    // Set up openseadragon viewer
    this.viewer = viaWebGL.OpenSeadragon({
      collectionMode: false,
      showZoomControl: false,
      showHomeControl: false,
      loadTilesWithAjax: true,
      showFullPageControl: false,
      // Specific to this project
      id: "ImageView",
      compositeOperation: "lighter",
      prefixUrl: "image/openseadragon/",
      tileSources: this.makeTileSources(ids),
      maxZoomPixelRatio: 10,
      ajaxHeaders: {
        "Cache-Control": "no-store"
      }
    });
    interactor(this.viewer);

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

		const viewer = this.viewer;

		function updateOverlays() {
				viewer.currentOverlays.forEach(overlay => {
						const isWhite = overlay.element.className == 'white-overlay';
						const isGreen = overlay.element.className == 'green-overlay';
						if (!(isWhite || isGreen)) {
							overlay.element.style.transform = '';
						}
				});
		}

		viewer.addHandler("update-viewport", function(){
				setTimeout(updateOverlays, 1);
		});

		viewer.addHandler("animation", updateOverlays);

    // Define interface to shaders
    const seaGL = new viaWebGL.openSeadragonGL(this.viewer);
    seaGL.vShader = 'vert.glsl';
    seaGL.fShader = 'frag.glsl';

    seaGL.addHandler('tile-drawing',  function(callback, e) {
			// Read parameters from each tile
			const tile = e.tile;
			const via = this.viaGL;
			const viewer = this.openSD;
			const image = e.tiledImage;
			const source = image.source;

			// Store channel color and range to send to shader
			via.color_3fv = new Float32Array(source.many_channel_color);
			via.range_2fv = new Float32Array(source.many_channel_range);

			// Start webGL rendering
			callback(e);
  	});

    seaGL.addHandler('gl-drawing', function() {
			// Send color and range to shader
			this.gl.uniform3fv(this.u_tile_color, this.color_3fv);
			this.gl.uniform2fv(this.u_tile_range, this.range_2fv);

			// Clear before each draw call
			this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  	});

    seaGL.addHandler('gl-loaded', function(program) {
			// Turn on additive blending
			this.gl.enable(this.gl.BLEND);
			this.gl.blendEquation(this.gl.FUNC_ADD);
			this.gl.blendFunc(this.gl.ONE, this.gl.ONE);

			// Uniform variable for coloring
			this.u_tile_color = this.gl.getUniformLocation(program, 'u_tile_color');
			this.u_tile_range = this.gl.getUniformLocation(program, 'u_tile_range');
		});

		seaGL.addHandler('tile-loaded', (callback, e) => callback(e));

    seaGL.init();
  }

  componentDidUpdate() {
    const {viewer} = this;
    const {overlays, arrows} = this.props;

    this.viewer.viewport.setRotation(this.props.rotation);

    arrows.forEach((a,i) => {
      const o = a.position;
      const el = "label-" + i;
			const elNew = "new-" + el;
			const element = document.getElementById(el);
			let newElement = document.getElementById(elNew);
			if (!newElement) {
				newElement = element.cloneNode(true);
				newElement.id = elNew;
			}
			else {
				newElement.className = element.className;
        newElement.innerText = element.innerText;
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
    for (var i = arrows.length; i < 100; i ++) {
      const elNew = "new-label-" + i;
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
  }

  render() {
    const {viewer} = this;
    const {arrows} = this.props;

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
        this.addChannels([...ids]);
      }
      else {
        // Compare the channel ids
        const old_ids = new Set(this.getTiledImageIds());
        const redrawn = intersectSet(ids, old_ids);
        const removed = differSet(old_ids, ids);
        const added = differSet(ids, old_ids);

        removed.forEach(id => {
          world.removeItem(this.getTiledImageById(id))
        })

        this.addChannels([...added])
        
        // Redraw channels that differ
        this.redrawChannels(redrawn.filter(id => {
          const channel = this.getChannel(id);
          const { color, range, maxRange } = channels.get(id);
          // True if any property value differs
          return (
            channel.range[0] != range['min'] / maxRange |
            channel.range[1] != range['max'] / maxRange |
            channel.color[0] != color[0] |
            channel.color[1] != color[1] |
            channel.color[2] != color[2]
          )
        }));
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
      const elText = "label-" + i;
      const radius = 122.8 / 2;
      const a = arrows.length > i ? arrows[i] : undefined;
      const angle = a && a.angle !== '' ? a.angle: 60;
      const a_y = radius * Math.sin(angle * Math.PI /180);
      const a_x = radius * Math.cos(angle * Math.PI /180);

      const t_w = 200;
      const t_h = 50;
      let t_x = 2 * a_x + t_w * Math.sign(Math.round(a_x)) / 2;
      let t_y = 2 * a_y + t_h * Math.sign(Math.round(a_y)) / 2;
      if (a.hide) {
        t_x = 0;
        t_y = 0;
      }

      let TransformArrow = styled.div`
        transform: translate(${a_x}px,${a_y}px)rotate(${angle}deg);
      `
      let TransformLabel = styled.div`
        transform: translate(${t_x}px,${t_y}px);
        background: rgba(0, 0, 0, .8);
        padding: 1em;
        width: ${t_w}px;
        height: ${t_h}px;
        overflow: hidden;
        color: white;
      `
			if (a.hide) {
				TransformArrow = styled.div`
					opacity: 0;
				`
			}
      if (a.text === '') {
        TransformLabel = styled.div`
					display: None;
        `
      }
      return (
        <div key={el}>
          <TransformArrow id={el}>
            <SvgArrow></SvgArrow>
          </TransformArrow>
          <TransformLabel id={elText}>
            {a.text}
          </TransformLabel>
        </div>
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

export default ImageView;
