import React, { Component } from "react";

import viaWebGL from 'viawebgl';
import AmazonWebSource from '../amazonwebsource';

import '../style/imageview';

class ImageView extends Component {

  constructor() {
    super();
    this.viewer = undefined;
    this.cache = new Map([
      ["uuid", undefined],
      ["ids", new Set()]
    ]);
    this.state = {
      defaults: {
        rows: 1,
        opacity: 1.0,
        tileSize: 1024,
        tileMargin: -1024,
        compositeOperation: "lighter",
        prefixUrl: "images/openseadragon/"
      },
			auth: {
				AccessKeyId: process.env.ACCESSKEYID,
				SessionToken: process.env.SESSIONTOKEN,
			  SecretAccessKey: process.env.SECRETACCESSKEY
			}
    }
  }

  makeTileSource(id) {
    const {auth} = this.state;
    const {img, channels} = this.props;

    const channel = channels.get(id);
    const {color, range} = channel;
    const {url} = img;

		const getTileName = (x, y, level, channel) => {
			return "C" + channel + "-T0-Z0-L" + level + "-Y" + y + "-X" + x + ".png";
		}

		const getTileUrl = function(l, x, y) {
			var level = this.maxLevel - l;
			var url = this.many_channel_url;
			var channel = this.many_channel_id;

			var name = getTileName(x, y, level, channel);
			return url + '/' + name;
		}

    return {
			// Custom functions
    	makeAjaxRequest: new AmazonWebSource(auth).makeAjaxRequest,
			getTileUrl: getTileUrl,
			// CUstom parameters
      many_channel_id: id,
			many_channel_url: url,
      many_channel_range: range,
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
    return ids.map(this.makeTileSource, this);
  }

  getTiledImageById(id) {
    if (this.viewer !== undefined) {
      const {world} = this.viewer;

      for (var i = 0; i < world.getItemCount(); i++) {
        var tiledImage = world.getItemAt(i);
        var {many_channel_id} = tiledImage.source;

        if (id == many_channel_id)
          return tiledImage;
      }
    }
    return undefined;
  }

  loseChannels(ids) {
    if (this.viewer !== undefined) {
      const {world} = this.viewer;
      var tiledImages = ids.map(this.getTiledImageById, this);
      tiledImages = tiledImages.filter(i=>i !== undefined);
      tiledImages.map(world.removeItem, world);
    }
  }

  updateChannels(ids) {
    if (this.viewer !== undefined) {
      const {world} = this.viewer;
      const {channels} = this.props;

      ids.forEach((id) => {
        let {color, range} = channels.get(id);
        let tiledImage = this.getTiledImageById(id);
        if (tiledImage !== undefined) {
          tiledImage._needsDraw = true;
          let {source} = tiledImage;
          source.many_channel_color = color.map(c => c / 255.);
          source.many_channel_range = range;
        }
      })
    }
  }

  gainChannels(ids) {
    const {viewer} = this;
    if (viewer !== undefined) {
      const tileSources = this.makeTileSources(ids);
      tileSources.forEach(tileSource => {
        viewer.addTiledImage({
          tileSource: tileSource
        });
      });
    }
  }

  updateCache() {
    const {cache} = this;
    const ids = cache.get("ids");
    const uuid = cache.get("uuid");
    const {channels, img} = this.props;

    // Get new Values
    var cacheNext = new Map(cache);
    const uuidNext = '' + img.uuid;
    const idsNext = new Set(channels.keys());

    // Set new Values
    cacheNext.set("ids", idsNext);
    cacheNext.set("uuid", uuidNext);

    // Update the whole image
    if (uuidNext != uuid) {
      this.loseChannels([...ids]);
      this.gainChannels([...idsNext]);
      return cacheNext;
    }

    const differ = (a, b) => [...a].filter(i => !b.has(i));
    const intersect = (a, b) => [...a].filter(b.has.bind(b));

    // Lose, gain, or update channels
    this.loseChannels(differ(ids, idsNext));
    this.gainChannels(differ(idsNext, ids));
    this.updateChannels(intersect(idsNext, ids));
    return cacheNext;
  }

  componentDidMount() {
    const {defaults} = this.state;
    const {channels} = this.props;
    const ids = [...channels.keys()];

    // Update Tile Sources
    var tileSources = this.makeTileSources(ids);

    // Set up openseadragon viewer
    this.viewer = viaWebGL.OpenSeadragon({
      id: "ImageView",
      debugMode: false,
      collectionMode: true,
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

    // Define interface to shaders
    var seaGL = new viaWebGL.openSeadragonGL(this.viewer);
    seaGL.vShader = 'vert.glsl';
    seaGL.fShader = 'frag.glsl';

    seaGL.addHandler('tile-drawing',  function(callback, e) {
			// Read parameters from each tile 
			var tile = e.tile;
			var via = this.viaGL;
			var viewer = this.openSD;
			var image = e.tiledImage;
			var source = image.source;

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
    const {img, channels} = this.props;
    const entries = channels.entries();

    // Handle changes
    this.cache = this.updateCache();

    return (
      <div id="ImageView"></div>
    );
  }
}

export default ImageView;
