import React, { Component } from "react";

import viaWebGL from 'viawebgl';

import '../style/imageview';


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
			tileSize: 1024,
			height: 4080,
			width: 7220,
			minLevel: 0,
			maxLevel: 3
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
    const tileSources = this.makeTileSources(ids);
    tileSources.map(tileSource => {
      viewer.addTiledImage({
        tileSource: tileSource
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
    const {channels, img} = this.props;
    const ids = [...channels.keys()];

    // Set up openseadragon viewer
    this.viewer = viaWebGL.OpenSeadragon({
      debugMode: false,
      collectionMode: true,
      showZoomControl: false,
      showHomeControl: false,
      loadTilesWithAjax: true,
      showFullPageControl: false,
      // Specific to this project
      id: "ImageView",
      collectionRows: 1,
      collectionTileSize: 1,
      collectionTileMargin: -1,
      compositeOperation: "lighter",
      prefixUrl: "images/openseadragon/",
      tileSources: this.makeTileSources(ids)
    });

    this.viewer.uuid = img.uuid;

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

    return (<div id="ImageView"></div>);
  }
}

export default ImageView;
