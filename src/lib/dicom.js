import GL from '@luma.gl/constants';
import { load } from '@loaders.gl/core';
import { BitmapLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import { ImageLoader } from '@loaders.gl/images';

class ContrastBitmapLayer extends BitmapLayer {

  getShaders() {
    const shaders = super.getShaders();
    const fragment = `\
    uniform float lower_range;
    uniform float upper_range;
    uniform vec4 channel_color;
    uniform vec2 window_corner;
    `;

    const contrastUniforms = {
      name: 'contrast',
      fs: fragment,
      uniformTypes: {enabled: 'f32'}
    };

    shaders.inject = {
      'fs:DECKGL_FILTER_COLOR': `
        // Threshhold within range
        float value = (
          (color.r - lower_range) /
          (upper_range - lower_range)
        );
        value = clamp(value, 0.0, 1.0);

        // Color pixel value
        color = value * channel_color;
        // Hide out of bounds
        if (geometry.uv.x > window_corner.x) {
          color = vec4(0.,0.,0.,0.);
        }
        if (geometry.uv.y > window_corner.y) {
          color = vec4(0.,0.,0.,0.);
        }
      `
    };

    // Add uniform binding to shader modules
    shaders.modules = [...shaders.modules, contrastUniforms];
    return shaders;
  }

  updateState({props, oldProps, changeFlags}) {
    super.updateState({props, oldProps, changeFlags});
    const changed = [
      "lower_range", "upper_range", "channel_color",
      "window_corner"
    ].some(
      k => props[k] !== oldProps[k]
    );
    if (changed) {
      // Set the custom uniform
      const {
        lower_range, upper_range, channel_color,
        window_corner
      } = props;
      for (const model of this.getModels()) {
        model.setUniforms({
          lower_range, upper_range, channel_color,
          window_corner
        });
      }
    }
  }
}

function createTileLayer(meta, tile_info) {
  const {
    id, visible, color, lowerRange, upperRange
  } = tile_info;
  const { pyramids } = meta;
  const height = [...pyramids["0"]].pop().height;
  const width = [...pyramids["0"]].pop().width;
  const tileSize = pyramids["0"][0].tileSize;
  const maxLevel = pyramids["0"].length;
  const minZoom = -maxLevel;
  const tileProps = {
    refinementStrategy: 'no-overlap',
    id, visible, tileSize,
    extent: [
      0, 0, tileSize*(1+2**maxLevel), 1000+tileSize*(1+2**maxLevel)
    ],
    minZoom: minZoom,
    maxZoom: -1,
    color: [
      ...color.map(v => v/255), 1
    ],
    lowerRange: lowerRange / 65535,
    upperRange: upperRange / 65535,
    getTileData: (args) => {
      const x = args.index.x;
      const y = args.index.y;
      const pyramid = pyramids[id];
      const zoom = String(Math.abs(args.zoom+maxLevel));
      if (!pyramid[zoom]?.frameMappings) {
        return null;
      }
      const subpath = pyramid[zoom].frameMappings[
        `${y+1}-${x+1}-${id}`
      ];
      if (!subpath) {
        return null;
      }
      return load(
        `${meta.series}/instances/${subpath}`, ImageLoader, {
        fetch: async (url) => {
          const response = await fetch(url, {
            headers: {
             "Accept": 'multipart/related; type="image/png"'
//              Accept: 'multipart/related; type="application/octet-stream"; transfer-syntax=*'
            }
          });
          const blob = await response.blob();
          const sliced = blob.slice(91);
          const buffer = await sliced.arrayBuffer();
          const view = new Uint8Array(buffer);
          return view;
        }
      });
    },
    renderSubLayers: (props) => {
      const { left, bottom, right, top } = props.tile.bbox;
      const { x, y } = props.tile.index;
      const zoom = props.tile.zoom+maxLevel;
      const info = (
        x > 3 ? `${x}` : (
          "etc"
        )
      )
      let edge_x = tileSize;
      let edge_y = tileSize;
      const pyramid = pyramids[id];
      if (pyramid[zoom]) {
        const { tileSize, width, height } = pyramid[zoom];
        edge_x = width-x*tileSize;
        edge_y = height-y*tileSize;
      }
      return [new ContrastBitmapLayer({
        id: `${id}-${x}-${y}-${zoom}`,
        window_corner: [edge_x, edge_y].map(v => v/tileSize),
        channel_color: props.color,
        lower_range: props.lowerRange,
        upper_range: props.upperRange,
        image: props.data,
        bounds: [
          left, bottom, right, top
        ],
        parameters: {
//          depthTest: false,
          blendFunc: [GL.ONE, GL.ONE, GL.ONE, GL.ONE],
//          blendEquation: GL.FUNC_ADD,
        },
      })
      ]
    },
  }
  return new TileLayer(tileProps);
}

export {
  createTileLayer
}
