import React, { Component } from "react";

import ChannelControlList from "../components/channelcontrollist";
import ChannelControl from "../components/channelcontrol";

class ChannelControls extends Component {

  render() {
    const {updateColor, updateRange} = this.props;
    const {imageOptions, channelMap} = this.props;
    const entries = channelMap.entries();

    return (
      <div>
        <ChannelControlList>
          {Array.from(entries).map(entry => { 
            const [id, chan] = entry;
            const {color, range} = chan;
            return (
              <ChannelControl key={id} chan={chan}
               onColorChange={(c) => updateColor(id, c)}
               onRangeChange={(r) => updateRange(id, r)}/>
            );
          })}
        </ChannelControlList>
      </div>
    );
  }
}

export default ChannelControls;
