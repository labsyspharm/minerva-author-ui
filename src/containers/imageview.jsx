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

    const { u32, map_ids, key, color, range, maxRange } = channel;
    let { url } = img;
    if (u32 === true) {
      url = 'http://localhost:2020/api/u32';
    }

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
			// Custom parameters
      u32: u32,
      unique_id: id,
      many_channel_url: url,
      many_channel_map_ids: map_ids,
      many_channel_id: u32 === true ? key : id,
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
      const {unique_id} = tiledImage.source;
      return unique_id;
    });
  }

  getTiledImageById(id) {
    const { world } = this.viewer;
    const itemCount = world.getItemCount();

    for (let i in [...Array(itemCount).keys()]) {
      const tiledImage = world.getItemAt(i);
      const { unique_id } = tiledImage.source;

      if (id == unique_id)
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
        width: img.width / img.height,
        compositeOperation: tileSource.u32 ? 'source-over' : 'lighter'
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
      prefixUrl: "image/openseadragon/",
      tileSources: this.makeTileSources(ids),
      compositeOperation: 'lighter',
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

      const all_same = (a, b) => {
        return a && b && a.every( (v, i) => v == b[i] );
      }

      const is_same = (
        all_same(via.color_3fv, e.rendered.color_3fv) &&
        all_same(via.range_2fv, e.rendered.range_2fv)
      )

      //TODO
      if (tile._format == 'u32' && source.many_channel_map_ids) {
        if (!tile._ready) {
          return;
        }
      }

			e.rendered.color_3fv = via.color_3fv;
			e.rendered.range_2fv = via.range_2fv;


      // Abort on all useless render calls
      if (is_same) {
        return;
      }

      let fmt = 0;
      if (tile._format == 'u16') {
        fmt = 16;      
      }
      else if (tile._format == 'u32') {
        fmt = 32;
      }

      via.fmt_1i = fmt;

			// Start webGL rendering
			callback(e);
  	});

    seaGL.addHandler('gl-drawing', function() {
			// Send color and range to shader
			this.gl.uniform3fv(this.u_tile_color, this.color_3fv);
			this.gl.uniform2fv(this.u_tile_range, this.range_2fv);
      this.gl.uniform1i(this.u_tile_fmt, this.fmt_1i);

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
			this.u_tile_fmt = this.gl.getUniformLocation(program, 'u_tile_fmt');
		});

		seaGL.addHandler('tile-loaded', (callback, e) => {
      callback(e);
      const {tile, tiledImage} = e;
      const {source} = tiledImage;
      if (tile._format == 'u32' && source.many_channel_map_ids) {
        const length = tile._array.length / 4;
        const pow2length = (2**Math.ceil(Math.log2(length)));
        const pow2width = Math.ceil(pow2length / 1024);
        const pow2height = 1024;
        const viaGLtmp = new ViaWebGL();
        viaGLtmp.updateShape(pow2width, pow2height);
        viaGLtmp.vShader = 'vert.glsl';
        viaGLtmp.fShader = `#version 300 es
precision highp int;
precision highp float;
precision highp usampler2D;

uniform usampler2D u_tile;
uniform usampler2D u_ids;
uniform ivec2 u_ids_shape;

const uint MAX = uint(16384) * uint(16384);
const uint bMAX = uint(ceil(log2(float(MAX))));
       
in vec2 uv;
out vec4 color;

// rgba to 32 bit int
uint unpack(uvec4 id) {
  return id.x + uint(256)*id.y + uint(65536)*id.z + uint(16777216)*id.w;
}

// ID Lookup
uint lookup_ids_idx(float idx) {

  vec2 ids_max = vec2(float(u_ids_shape.x), float(u_ids_shape.y));
  vec2 ids_idx = vec2(mod(idx, ids_max.x) / ids_max.x, floor(idx / ids_max.x) / ids_max.y);
  // Value for given index
  uvec4 m_value = texture(u_ids, ids_idx);
  return unpack(m_value);
}

// Binary Search
bool is_in_ids(uint ikey) {
  // Array size
  uint first = uint(0);
  uint last = uint(u_ids_shape.x) * uint(u_ids_shape.y);

  // Search within log(n) runtime
  for (uint i = uint(0); i <= bMAX; i++) {
    // Break if list gone
    if (first > last) break;

    // Evaluate the midpoint
    uint mid = (first + last) / uint(2);
    uint here = lookup_ids_idx(float(mid));

    // Search below midpoint
    if (here > ikey) last = mid-uint(1);

    // Search above midpoint
    else if (ikey > here) first = mid+uint(1);

    // Found at midpoint
    else return true;
  }
  // Not found
  return false;
}

void main() {
  uvec4 pixel = texture(u_tile, uv);
  uint id = unpack(pixel);

  if (id != uint(0) && is_in_ids(id)) {
    color = vec4(float(1) / float(255), 0.0, 0.0, 0.0);
  }
  else {
    color = vec4(0.0, 0.0, 0.0, 0.0);
  }
}
`;
        const padding = new Uint8Array(4 * (pow2length - length));
        const pow2array = Uint8Array.from([...tile._array, ...padding]);
        viaGLtmp['gl-loaded'] = (program) => {
          const {gl} = viaGLtmp;

          const toBytesInt32 = (a, padding=0) => {
            const arr_length = a.length + padding;
            const arr = new ArrayBuffer(4 * arr_length);
            const view = new DataView(arr);
            a.forEach((v, i)=> {
              view.setUint32(4 * padding + 4 * i, v, true);
            })
            return new Uint8Array(arr);
          }

          const map_ids = source.many_channel_map_ids;
          const ids_width = gl.getParameter(gl.MAX_TEXTURE_SIZE);
          const ids_height = Math.ceil(map_ids.length / ids_width);
          const ids_padding = ids_width * ids_height - map_ids.length;
          const ids_array = toBytesInt32(map_ids, ids_padding);

          // Get texture shape location
          const u_ids_shape = gl.getUniformLocation(program, 'u_ids_shape');
          const ids_shape_2iv = [ids_width, ids_height];
          gl.uniform2iv(u_ids_shape, ids_shape_2iv);

          // Get texture location
          const u_ids = gl.getUniformLocation(program, 'u_ids');
          gl.uniform1i(u_ids, 1);

          // Set texture for GLSL
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, gl.createTexture()),
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
          gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

          // Assign texture parameters
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

          // Send the tile to the texture
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8UI, ids_width, ids_height, 0,
                        gl.RGBA_INTEGER, gl.UNSIGNED_BYTE, ids_array);
        }
        viaGLtmp.init().then(() => {
          const {gl} = viaGLtmp;
          viaGLtmp.loadArray(pow2width, pow2height, pow2array, tile._format);
          let data = new Uint8Array(pow2length * 4);
          gl.readPixels(0, 0, pow2width, pow2height, gl.RGBA, gl.UNSIGNED_BYTE, data);

          // make a temp buffer to hold one row
          var temp = new Uint8Array(pow2width * 4);
          var halfHeight = pow2height / 2 | 0;
          var bytesPerRow = pow2width * 4;
          for (var y = 0; y < halfHeight; ++y) {
            var topOffset = y * bytesPerRow;
            var bottomOffset = (pow2height - y - 1) * bytesPerRow;

            // make copy of a row on the top half
            temp.set(data.subarray(topOffset, topOffset + bytesPerRow));

            // copy a row from the bottom half to the top
            data.copyWithin(topOffset, bottomOffset, bottomOffset + bytesPerRow);

            // copy the copy of the top half row to the bottom half 
            data.set(temp, bottomOffset);
          } 


          tile._array = data.subarray(0, length * 4);
          // TODO
          tile._ready = true;

          //console.log({data: data.length, _array: tile._array.length});
        });

      }
    });

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
