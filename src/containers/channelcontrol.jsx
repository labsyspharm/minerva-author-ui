import React, { Component } from "react";

import ChannelList from "../components/channellist";
import Channel from "../components/channel";

class ChannelControl extends Component {

  constructor() {
    super();
    this.state = {
      channelMap: new Map(),
      sliderSet: new Set(),
      channels: [],
    };
  }

  componentDidMount() {

    this.addChannel({
      id: 0,
      color: "FF0000",
      range: [0, 0.1]
    },  () => {
      this.addChannel({
        id: 1,
        color: "0000FF",
        range: [0, 1]
      })
   ; });

  }

  componentDidUpdate() {
  
    const {channels, channelMap, sliderSet} = this.state;
    var newSliderSet = new Set();

    channels.map((id) => {
      if ( !sliderSet.has(id)) {
        return newSliderSet.add(id);
      }
    });

    if (newSliderSet.size != 0) {
      this.setState({
        channels: channels,
        channelMap: channelMap,
        sliderSet: new Set([
          ...sliderSet, ...newSliderSet
        ])
      })  
    }
  }

  addChannel(channel, callback=()=>{}) {
    const {id} = channel;
    const {channels, channelMap} = this.state;

    var newChannelMap = new Map(channelMap);
    newChannelMap.set(id, channel);

    this.setState({
      channelMap: newChannelMap,
      channels: channels.concat([id])
    }, callback)
  }

  render() {
    const {channels, channelMap} = this.state;
    return (
      <div className="ChannelControl">
        <ChannelList>
          {channels.map(id => {
            const channel = channelMap.get(id);
            const {color, range} = channel;
            return (
              <Channel key={id} channel={channel}/>
            );
          })}
        </ChannelList>
      </div>
    );
  }
}

export default ChannelControl;
