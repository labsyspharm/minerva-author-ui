import React, { Component } from "react";

import Select from 'react-select';

import ChannelControls from "./channelcontrols";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import '../style/controls'

class Controls extends Component {

  constructor(props) {
    super();
  }

  render() {

    const {activeStory} = this.props;
    const {handleStoryChange} = this.props;
    const {storyName, storyText, textEdit} = this.props;
    const {handleStoryName, handleStoryText} = this.props;

    if (textEdit) {
      return (<div>
        <div>
          <div className="bg-black">
            Waypoint #{activeStory}: 
          </div>
          <input type="text" value={storyName} onChange={handleStoryName}></input>
          <button onClick={()=>{
            handleStoryChange(Math.max(0, activeStory - 1))
          }}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <button onClick={()=>{
            handleStoryChange(activeStory + 1)
          }}>
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
        <textarea className="width-100" value={storyText} onChange={handleStoryText}></textarea>
        </div>)
    }

    const {handleSelect, handleChange} = this.props;
    const {activeChanLabel, chanLabel} = this.props;
    const {activeChannels} = this.props;

    return (
      <div>
        <Select
          isMulti={true}
          onChange={handleSelect}
          value={Array.from(activeChanLabel.values())}
          options={Array.from(chanLabel.values())}
        />
        <ChannelControls className="ChannelControls"
          channels={ activeChannels }
          handleChange={ handleChange }
        />
      </div>
    );
  }
}

export default Controls;
