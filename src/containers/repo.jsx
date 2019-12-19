import React, { Component } from "react";
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';

import ImageView from "./imageview";
import ChannelControls from "./channelcontrols";

import '../style/repo'

const randInt = n => Math.floor(Math.random() * n);
const randColor = () => {
  return [
    [0,0,255],[0,127,255],[0,255,0],[0,255,127],[0,255,255],
    [127,0,255],[127,127,127],[127,127,255],[127,255,0],[127,255,127],
    [255,0,0],[255,0,127],[255,0,255],[255,127,0],[255,127,127],[255,255,0]
  ][randInt(16)]
}

class Repo extends Component {

  constructor(props) {
    super();

    const { channels } = props;

    this.state = {
			img: {
          uuid: 'uuid0',
					url: '/api/u16'
			},
      activeGroup: null,
      groups: new Map([]),
      activeIds: [0, 1],
      chanLabel: new Map([...Array(channels).keys()].map(i => {
        return [i, {
          value: i, id: i,
          label: '' + i,
        }];
      })),
      chanRender: new Map([...Array(channels).keys()].map(i => {
        return [i, {
          maxRange: 65535,
          value: i, id: i,
          color: randColor(),
          range: {min: 0, max: 32768}
        }];
      }))
    };

    // Bind
    this.handleChange = this.handleChange.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.handleSelectGroup = this.handleSelectGroup.bind(this);
    this.renderGroups = this.renderGroups.bind(this);
  }

  handleSelectGroup(g) {
    const { groups, activeIds, chanRender } = this.state;

    if (g.__isNew__) {
      const id = groups.size;
      const newGroup = {
        chanRender: chanRender,
        activeIds: activeIds,
        label: g.label,
        value: id
      }
    
      const newGroups = new Map([...groups,
                                ...(new Map([[id, newGroup]]))]);

      this.setState({
        groups: newGroups,
        activeGroup: id
      });
    }
    else {
      this.setState({
        activeGroup: g.value,
        activeIds: g.activeIds
      });
    }
  }

  handleSelect(channels) {
    const {groups, activeGroup} = this.state;
    const channelArray = channels? channels : [];
    const activeIds = channelArray.map(c => c.id);

    const group = groups.get(activeGroup);

    this.setState({
      activeIds
    })

    if (group) {
      const newGroup = {
        chanRender: group.chanRender, 
        activeIds: activeIds,
        label: group.label,
        value: group.value
      }
    
      const newGroups = new Map([...groups,
                                ...(new Map([[activeGroup, newGroup]]))]);

      this.setState({
        groups: newGroups
      })
    }
  }

  handleChange(id, color, range, label) {
    const { chanRender, chanLabel, groups, activeGroup } = this.state;
    const group = groups.get(activeGroup);
    let newRender = { ...chanRender.get(id) };
    if (group) {
      newRender = { ...group.chanRender.get(id) };
    }
    const newLabel = { ...chanLabel.get(id) };

    if (color) {
      newRender['color'] = color;
    }
    if (range) {
      newRender['range'] = range;
    }
    if (label !== null) {
      newLabel['label'] = label;
    }
    const newChanLabel = new Map([...chanLabel,
                                 ...(new Map([[id, newLabel]]))]);

    this.setState({
      chanLabel: newChanLabel
    });
    if (group) {
      const newGroup = {...group}
      const newChanRender = new Map([...group.chanRender,
                                 ...(new Map([[id, newRender]]))]);
      newGroup['chanRender'] = newChanRender
      const newGroups = new Map([...groups,
                                ...(new Map([[activeGroup, newGroup]]))]);
      this.setState({
        groups: newGroups,
      });
    }
    else {
      const newChanRender = new Map([...chanRender,
                                 ...(new Map([[id, newRender]]))]);
      this.setState({
        chanRender: newChanRender,
      });
    }
  }

  renderGroups() {

    const {groups} = this.state;
    const data = {
      'groups': Object.fromEntries(groups)
    }
  
    fetch('/api/render', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  render() {
    const { img, groups, chanLabel, chanRender, activeIds, activeGroup } = this.state;
    const group = groups.get(activeGroup);
    let activeChanRender = new Map(activeIds.map(a => [a, chanRender.get(a)]))
    if (group) {
      activeChanRender = new Map(activeIds.map(a => [a, group.chanRender.get(a)]))
    }
    console.log('activeChanRender', activeChanRender)
    const activeChanLabel = new Map(activeIds.map(a => [a, chanLabel.get(a)]))
    const activeChannels = new Map(activeIds.map(a => [a, {
      ...activeChanLabel.get(a), ...activeChanRender.get(a)
    } ])) 

    return (

      <div className="container-fluid Repo">
        <ImageView className="ImageView"
          img={ img }
          channels={ activeChannels }
        />
        <div className="row justify-content-between">
          <div className="col-md-5">
            <button onClick={this.renderGroups}>
              Render Groups
            </button>
            <CreatableSelect
              isClearable
              onChange={this.handleSelectGroup}
              options={Array.from(groups.values())}
            />
            <Select
              isMulti={true}
              onChange={this.handleSelect}
              value={Array.from(activeChanLabel.values())}
              options={Array.from(chanLabel.values())}
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
