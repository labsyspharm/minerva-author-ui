import React, { Component } from "react";

import viaWebGL from 'viawebgl';
import AmazonWebSource from '../amazonwebsource';

import '../style/imageview';

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
      },
			auth: {
				AccessKeyId: process.env.ACCESSKEYID,
				SessionToken: process.env.SESSIONTOKEN,
			  SecretAccessKey: process.env.SECRETACCESSKEY
			}
    }
  }

  makeTileSource(entry) {
    const {auth} = this.state;
    const {url} = this.props.imageOptions;

    const [id, channelcontrol] = entry;
    const {color, range} = channelcontrol;

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

    var output = {
			// Custom functions
    	makeAjaxRequest: new AmazonWebSource(auth).makeAjaxRequest,
			getTileUrl: getTileUrl,
			// CUstom parameters
      many_channel_id: id,
			many_channel_url: url,
      many_channel_range: range,
      many_channel_color: map(color, c => c / 255.),
			// Standard parameters
			tileSize: 1024,
			height: 4080,
			width: 7220,
			minLevel: 0,
			maxLevel: 3
    }

    // Make AWS request
    output.makeAjaxRequest = aws; 

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
    var seaGL = new viaWebGL.openSeadragonGL(viewer);
    seaGL.vShader = 'static/vert.glsl';
    seaGL.fShader = 'static/frag.glsl';

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

    seaGL.init();
  }

  render() {
    const {imageOptions, channelMap} = this.props;
    const entries = channelMap.entries();

    return (
      <div id="ImageView"></div>
    );
  }
}

export default ImageView;
