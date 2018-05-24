import React, { Component } from "react";

import ImageView from "./imageview";
import ChannelControls from "./channelcontrols";
import ImportList from "../components/importlist";
import Import from "../components/import";

class Repo extends Component {

  constructor() {
    super();
    this.state = {
      importMap: new Map([
         [1, {
          id: 1,
          name: "Some Import"
         }],
         [2, {
          id: 2,
          name: "Another Import"
         }]
      ]),
      imageMaps: new Map([
        [1, new Map([
            [1, {
              id: 1,
              name: "Some Image",
              url: "http://example.com"
            }],
            [2, {
              id: 2,
              name: "Second Image",
              url: "http://example.com"
            }]
          ])
        ],
        [2, new Map([
            [1, {
              id: 1,
              name: "Another Image",
              url: "http://example.com",
              channels: [1, 2]
            }]
          ])
        ]
      ]),
      channelMaps: new Map([
        ['1,1', new Map()],
        ['1,2', new Map()],
        ['2,1', new Map()]
      ]),
      imports: [1, 2],
      activeChannel: 1,
      activeImport: 1,
      activeImage: 1
    };
  }

  componentDidMount() {


    // Import 1, Image 1
    this.addChannel(1, 1, {
      id: 0,
      color: [255, 0, 0],
      range: [0, 0.5]
    },  () => {
      this.addChannel(1, 1, {
        id: 1,
        color: [0, 0, 255],
        range: [0, 0.5]
      })
    });

    // Import 1, Image 2
    this.addChannel(1, 1, {
      id: 0,
      color: [255, 255, 0],
      range: [0, 0.7]
    },  () => {
      this.addChannel(1, 1, {
        id: 1,
        color: [0, 255, 255],
        range: [0, 0.3]
      })
    });

    // Import 1, Image 2
    this.addChannel(1, 1, {
      id: 0,
      color: [255, 127, 127],
      range: [0, 1.0]
    },  () => {
      this.addChannel(1, 1, {
        id: 1,
        color: [127, 127, 255],
        range: [0, 0.1]
      })
    });

  }
  addChannel(imported, imaged, channelcontrol, callback=()=>{}) {

    const {id} = channelcontrol;
    const {channelMaps} = this.state;
    const keys = [imported, imaged].join();
    const channelMap = channelMaps.get(keys);

    var newChannelMap = new Map(channelMap);
    var newChannelMaps = new Map(channelMaps);

    newChannelMap.set(id, channelcontrol);
    newChannelMaps.set(keys, newChannelMap);

    this.setState({
      channelMaps: newChannelMaps
    }, callback)
  }

  updateColor(imported, imaged, id, rgbColor) {

    const {channelMaps} = this.state;

    const keys = [imported, imaged].join();
    const channelMap = channelMaps.get(keys);
    
    var newChannelMap = new Map(channelMap);
    var newChannelMaps = new Map(channelMaps);

    newChannelMap.get(id).color = rgbColor;
    newChannelMaps.set(keys, newChannelMap);

    this.setState({
      channelMaps: newChannelMaps
    })
  }

  updateRange(imported, imaged, id, range_percent) {

    const {channels, channelMaps} = this.state;

    const keys = [imported, imaged].join();
    const channelMap = channelMaps.get(keys);

    var newChannelMap = new Map(channelMap);
    var newChannelMaps = new Map(channelMaps);
    
    // input validation
    const range = range_percent.map(v => {
      return v / 100;
    });
    if (!(0 <= range[0] < range[1] <= 1)) {
      return;
    }

    newChannelMap.get(id).range = range
    newChannelMaps.set(keys, newChannelMap);

    this.setState({
      channelMaps: newChannelMaps
    })

  }

  render() {
    const {importMap, imageMaps, channelMaps} = this.state;
    const {activeImport, activeImage} = this.state;

    const keys = [activeImport, activeImage].join();
    const imageOptions = imageMaps.get(activeImport).get(activeImage);
    const channelMap = channelMaps.get(keys);

    return (
      <div className="Repo">
        <ImportList>
          {this.state.imports.map(id => {
            const imported = importMap.get(id);
            const imageMap = imageMaps.get(id);
            return (
              <Import key={id} imageMap={imageMap} imported={imported}/>
            );
          })}
        </ImportList>
        <ChannelControls
          imageOptions={imageOptions}
          channelMap={channelMap}
          updateColor={this.updateColor.bind(this, activeImport, activeImage)}
          updateRange={this.updateRange.bind(this, activeImport, activeImage)}
        />
        <ImageView
          imageOptions={imageOptions}
          channelMap={channelMap}
        />
      </div>
    );
  }
}

export default Repo;
