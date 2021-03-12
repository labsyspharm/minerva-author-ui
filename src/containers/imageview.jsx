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
    this.state = {
      ready: false,
      waiting: false
    }
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
      const url = this.many_channels_url;
      const channel = this.many_channels_id;

      let name = getTileName(x, y, level, channel);
      // Prevent cache mistakes
      if (this.many_channels[0].map_ids.length > 0) {
        name += '?map';
      }
      return url + '/' + name;
    }

    return {
      // Custom functions
      getTileUrl: getTileUrl,
      // Custom parameters
      u32: u32,
      many_channels_id: u32 === true ? key : id,
      many_channels_url: url,
      many_channels: [{
        unique_id: id,
        map_ids: map_ids || [],
        color: color.map(c => c / 255.),
        range: [range['min'] / maxRange, range['max'] / maxRange]
      }],
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

    return [...Array(itemCount).keys()].reduce((items, i) => {
      const tiledImage = world.getItemAt(i);
      return tiledImage.source.many_channels.reduce((all, chan) => {
        all.push(chan.unique_id);
        return all;
      }, items);
    }, []);
  }

  getTiledImageByMaskKey(key) {
    const { world } = this.viewer;
    const itemCount = world.getItemCount();

    for (let i in [...Array(itemCount).keys()]) {
      const tiledImage = world.getItemAt(i);
      const { many_channels, many_channels_id} = tiledImage.source;

      // Return any mask with a map
      if (key == many_channels_id && many_channels[0].map_ids.length > 0) {
        return tiledImage;
      }
    }
  }

  getTiledImageById(id) {
    const { world } = this.viewer;
    const itemCount = world.getItemCount();

    for (let i in [...Array(itemCount).keys()]) {
      const tiledImage = world.getItemAt(i);
      const { many_channels } = tiledImage.source;

      if (many_channels.find( (chan) => id == chan.unique_id))
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

  addChannel(tileSource) {
    return new Promise((resolve, reject)=> {
      let need_new_tiled_image = true;
      const {many_channels, many_channels_id} = tileSource;
      // Handle Mask channels that can use the same source
      if (many_channels[0].map_ids.length > 0) {
        const tiledImage = this.getTiledImageByMaskKey(many_channels_id);
        if (tiledImage) {
          const {source} = tiledImage;
          source.many_channels = source.many_channels.concat(many_channels);
          resolve({item: tiledImage});
          need_new_tiled_image = false;
        }
      }
      if (need_new_tiled_image) {
        this.viewer.addTiledImage({
          success: resolve,
          tileSource: tileSource,
          width: this.props.img.width / this.props.img.height,
          compositeOperation: tileSource.u32 ? 'source-over' : 'lighter'
        });
      }
    });
  }

  addTileSources(tileSources) {
    tileSources.reduce((p, tileSource) => {
     return p.then(() => this.addChannel(tileSource));
    }, Promise.resolve());
  }

  addChannels(ids) {
    this.addTileSources(this.makeTileSources(ids));
  }

  setChannel(channel) {
    const { id, color, range, maxRange } = channel;
    var tiledImage = this.getTiledImageById(id);
    if (tiledImage === undefined) {
      return;
    }
    const {source} = tiledImage;
    tiledImage._needsDraw = true;
    const {many_channels} = source;

    many_channels.forEach((chan) => {
      if (chan.unique_id == id) {
        chan.color = color.map(c => c / 255.);
        chan.range = [range['min'] / maxRange,
                     range['max'] / maxRange];
      }
    })
  }

  getChannel(id) {
    var tiledImage = this.getTiledImageById(id);
    if (tiledImage === undefined) {
      return undefined;
    }
    const {source} = tiledImage;
    const {many_channels} = source;
    const chan = many_channels.find((chan) => chan.unique_id == id);
    if (chan === undefined) {
      return undefined;
    }
    return {
      id: chan.id,
      range: chan.range,
      color: chan.color.map(c => Math.round(c * 255))
    }
  }

  startOpenSeadragon() {
    return new Promise((resolve) => {
      const {channels, img, handleViewport} = this.props;
      const {interactor} = this.props;
      const ids = [...channels.keys()];
      const tileSources = this.makeTileSources(ids);

      if (tileSources.length < 1) {
        return false;
      }

      // Handle only first tile source at beginning
      const firstTileSource = tileSources.shift();

      // Set up openseadragon viewer
      this.viewer = viaWebGL.OpenSeadragon({
        collectionMode: false,
        showZoomControl: false,
        showHomeControl: false,
        loadTilesWithAjax: true,
        showFullPageControl: false,
        preserveViewport: true,
        // Specific to this project
        id: "ImageView",
        prefixUrl: "image/openseadragon/",
        tileSources: [firstTileSource],
        compositeOperation: 'lighter',
        maxZoomPixelRatio: 10,
        ajaxHeaders: {
          "Cache-Control": "no-store"
        }
      });

      interactor(this.viewer);

      let resolved = false;
      const world = this.viewer.world;
      world.addHandler('add-item', (e) => {
        e.item.setWidth(img.width / img.height);
        if (!resolved) {
          resolved = true;
          resolve();
        }
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

      // Override loadArray to add more complex drawing
      seaGL.viaGL.loadArray = function(width, height, pixels, format='u16') {

          // Allow for custom drawing in webGL
          var gl = this.gl;

          // Clear before starting all the draw calls
          gl.clear(this.gl.COLOR_BUFFER_BIT);

          // Reset texture for GLSL
          setTexture.call(this, gl.TEXTURE0, this.texture);

          // Send the tile into the texture.
          if (format == 'u16') {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG8UI, width, height, 0,
                          gl.RG_INTEGER, gl.UNSIGNED_BYTE, pixels);
          }
          else if (format == 'u32') {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8UI, width, height, 0,
                          gl.RGBA_INTEGER, gl.UNSIGNED_BYTE, pixels);
          }

          var num_idx = [
            this.all_color_3fv, this.all_range_2fv,
            this.all_ids_shape_2iv, this.all_ids_array
          ].reduce(function(a,b) {
            return a.length < b.length ? a.length : b.length
          }, []);

          for (let idx = 0; idx < num_idx; idx ++) {
            // Call gl-drawing __after__ loading TEXTURE0
            this['gl-drawing'].call(this, idx);
            // Draw four points
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          }
          return this.gl.canvas;
      }
      seaGL.vShader = 'vert.glsl';
      seaGL.fShader = 'frag.glsl';

      seaGL.addHandler('tile-drawing',  function(callback, e) {

        // Read parameters from each tile
        const tile = e.tile;
        const via = this.viaGL;
        const viewer = this.openSD;
        const image = e.tiledImage;
        const source = image.source;
        const {many_channels} = source;

        // Store channel color and range to send to shader
        const all_color_3fv = many_channels.map((chan) => {
          return new Float32Array(chan.color);
        });
        const all_range_2fv = many_channels.map((chan) => {
          return new Float32Array(chan.range);
        });

        const all_same = (a, b) => {
          return a && b && a.length == b.length && a.every( (v, i) => v == b[i] );
        }

        const all_all_same = (a, b) => {
          return a && b && a.length == b.length && a.every( (v, i) => all_same(v, b[i]) );
        }

        const is_same = (
          all_all_same(all_color_3fv, e.rendered.all_color_3fv) &&
          all_all_same(all_range_2fv, e.rendered.all_range_2fv)
        )

        e.rendered.all_color_3fv = all_color_3fv;
        e.rendered.all_range_2fv = all_range_2fv;

        // Abort on all useless render calls
        if (is_same) {
          return;
        }

        const toBytesInt32 = (a, padding=0) => {
          const arr_length = a.length + padding;
          const arr = new ArrayBuffer(4 * arr_length);
          const view = new DataView(arr);
          a.forEach((v, i)=> {
            view.setUint32(4 * padding + 4 * i, v, true);
          })
          return new Uint8Array(arr);
        }

        let fmt = 0;
        if (tile._format == 'u16') {
          fmt = 16;      
        }
        else if (tile._format == 'u32') {
          fmt = 32;
        }

        let all_ids_array = [];
        let all_ids_shape_2iv = [];

        source.many_channels.forEach((chan) => {
          let ids_width = 0;
          let ids_height = 0;
          let ids_array = undefined;
          const {map_ids} = chan;

          if (fmt == 32 && map_ids.length > 0) {
            ids_width = via.gl.getParameter(via.gl.MAX_TEXTURE_SIZE);
            ids_height = Math.ceil(map_ids.length / ids_width);
            ids_array = toBytesInt32(map_ids, ids_width * ids_height - map_ids.length);
          }

          all_ids_array.push(ids_array);
          all_ids_shape_2iv.push([ids_width, ids_height]);
        });

        via.fmt_1i = fmt;
        via.all_color_3fv = all_color_3fv;
        via.all_range_2fv = all_range_2fv;
        via.all_ids_array = all_ids_array;
        via.all_ids_shape_2iv = all_ids_shape_2iv; 

        // Clear the rendered tile
        if (fmt == 32) {
          var w = e.rendered.canvas.width;
          var h = e.rendered.canvas.height;
          e.rendered.clearRect(0, 0, w, h);
        }
        // Start webGL rendering
        callback(e);
      });

      const setTexture = function(TEXTURE, texture){
        // Set texture for GLSL
        this.gl.activeTexture(TEXTURE);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture),
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1);
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1);

        // Assign texture parameters
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
      }


      seaGL.addHandler('gl-drawing', function(idx) {
        // Send color and range to shader
        this.gl.uniform1i(this.u_tile_fmt, this.fmt_1i);
        this.gl.uniform3fv(this.u_tile_color, this.all_color_3fv[idx]);
        this.gl.uniform2fv(this.u_tile_range, this.all_range_2fv[idx]);

        // Send ids shape to the shader
        this.gl.uniform2iv(this.u_ids_shape, this.all_ids_shape_2iv[idx]);
        const [ids_width, ids_height] = this.all_ids_shape_2iv[idx];

        const ids_array = this.all_ids_array[idx];
        if (ids_array != undefined) {
          // Set texture for GLSL
          setTexture.call(this, this.gl.TEXTURE1, this.texture_ids);

          // Send the tile to the texture
          this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA8UI, ids_width, ids_height, 0,
                        this.gl.RGBA_INTEGER, this.gl.UNSIGNED_BYTE, ids_array);
        }
        else {
          // Set texture for GLSL
          setTexture.call(this, this.gl.TEXTURE1, this.texture_ids);

          // Send an empty array to the texture
          this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA8UI, 1, 1, 0,
                        this.gl.RGBA_INTEGER, this.gl.UNSIGNED_BYTE, new Uint8Array(4));
        }
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

        // Get texture shape location
        this.u_ids_shape = this.gl.getUniformLocation(program, 'u_ids_shape');

        // Get texture location
        const u_ids = this.gl.getUniformLocation(program, 'u_ids');
        this.texture_ids = this.gl.createTexture();
        this.gl.uniform1i(u_ids, 1);
      });

      seaGL.addHandler('tile-loaded', (callback, e) => callback(e) );

      seaGL.init();
      return true;
    });
  }


  componentDidMount() {

    const {channels} = this.props;
    if (channels.size > 0 && !this.state.waiting) {
      this.setState({ waiting: true });
      this.startOpenSeadragon().then(()=>{
        this.setState({ waiting: false, ready: true });
      });
    }
  }

  componentDidUpdate() {
    const {viewer} = this;
    const {channels, overlays, arrows} = this.props;
    if (!viewer || !this.state.ready) {
      if (channels.size > 0 && !this.state.waiting) {
        this.setState({ waiting: true });
        this.startOpenSeadragon().then(()=>{
          this.setState({ waiting: false, ready: true });
        });
      }
      return;
    }

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
          const tiledImage = this.getTiledImageById(id);
          if (tiledImage != undefined) {
            const {source} = tiledImage;
            if (source.many_channels.length <= 1) {
              world.removeItem(tiledImage);
            }
            else {
              source.many_channels = source.many_channels.filter((chan) => {
                return chan.unique_id != id;
              });
              if (source.many_channels.length == 0) {
                world.removeItem(tiledImage);
              }
            }
          }
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
