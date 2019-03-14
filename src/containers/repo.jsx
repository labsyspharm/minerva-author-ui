import React, { Component } from "react";
import Select from 'react-select';

import ImageView from "./imageview";
import ChannelControls from "./channelcontrols";

import '../style/repo'

class Repo extends Component {

  constructor() {
    super();
    this.state = {
			img: {
					uuid: 'uuid4', name: 'image2',
					url: '/rendered/BP40'
			},
      activeIds: [0, 1],
			channels: new Map([
        [0, { label: '0', value: 0, id: 0, color: [255, 0, 0], range: { min: 0, max: 10000 }, maxRange: 65535}],
        [1, { label: '1', value: 1, id: 1, color: [0, 0, 255], range: { min: 10000, max: 65535 }, maxRange: 65535}]
      ])
    };

    // Bind
    this.handleChange = this.handleChange.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
  }

  handleSelect(channels) {
    const channelArray = channels? channels : [];
    const activeIds = channelArray.map(c => c.id);
    this.setState({
      activeIds
    })
  }

  handleChange(id, color, range, label) {
    const { channels } = this.state;
    const channel = channels.get(id);

    const newChannel = { ...channel };
    if (color) {
      newChannel['color'] = color;
    }
    if (range) {
      newChannel['range'] = range;
    }
    if (label) {
      newChannel['label'] = label;
    }
    const newChannels = new Map([...channels,
                                 ...(new Map([[id, newChannel]]))]);

    this.setState({
      channels: newChannels
    });
  }

  // <nav className="navbar navbar-default navbar-fixed-side">

  render() {
    const { img, channels, activeIds } = this.state;
    const activeChannels = new Map(activeIds.map(a => [a, channels.get(a)]))

    return (

      <div className="container-fluid Repo">
        <ImageView className="ImageView"
          img={ img }
          channels={ activeChannels }
        />
        <div className="row justify-content-between">
          <div className="col-md-5">
            <input type="text" value={'' + channels.get(0).label} 
              onChange={ e => this.handleChange(0, null, null, e.target.value) }
            />
            <Select
              isMulti={true}
              onChange={this.handleSelect}
              value={Array.from(activeChannels.values())}
              options={Array.from(channels.values())}
            />
            <ChannelControls className="ChannelControls"
              channels={ activeChannels }
              handleChange={ this.handleChange }
            />
          </div>
        </div>
      </div>
    );
  }
}

export default Repo;
