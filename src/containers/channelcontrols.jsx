import React, { Component } from "react";

import ChannelControlList from "../components/channelcontrollist";
import ChannelControl from "../components/channelcontrol";

class ChannelControls extends Component {

  render() {
    const { channels, handleChange, className } = this.props;

    const channelControls = Array.from(channels.values()).map(channel => {
      const { id, color, range, minRange, maxRange } = channel;
      return (
        <ChannelControl key={ id } id={ id } color={ color } range={ range }
                        minRange={ minRange } maxRange= { maxRange }
                        handleChange={ handleChange } />
      );

    });

    return (
      <ChannelControlList className={ className }>
        { channelControls }
      </ChannelControlList>
    );
  }
}

export default ChannelControls;
