import React, { Component } from "react";
import CreatableSelect from 'react-select/creatable';

import ImageView from "./imageview";
import CopyYaml from "./copyyaml";
import Controls from "./controls";

import '../style/repo'

const randInt = n => Math.floor(Math.random() * n);
const randColor = () => {
  return [
    [0,0,255],[0,127,255],[0,255,0],[0,255,127],[0,255,255],
    [127,0,255],[127,127,127],[127,127,255],[127,255,0],[127,255,127],
    [255,0,0],[255,0,127],[255,0,255],[255,127,0],[255,127,127],[255,255,0]
  ][randInt(16)]
}

const IntToHex = c => {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

const rgbToHex = rgb => {
  const [r, g, b] = rgb;
  return IntToHex(r) + IntToHex(g) + IntToHex(b);
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
      yaml: '',
      textEdit: false,
      activeStory: 0,
      stories: new Map([]),
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
    this.handleStoryName = this.handleStoryName.bind(this);
    this.handleStoryText = this.handleStoryText.bind(this);
    this.handleStoryChange = this.handleStoryChange.bind(this);
    this.handleSelectGroup = this.handleSelectGroup.bind(this);
    this.toggleTextEdit = this.toggleTextEdit.bind(this);
    this.renderGroups = this.renderGroups.bind(this);
  }

  handleStoryChange(newActiveStory) {
    const {stories, activeGroup} = this.state;
    const story = stories.get(newActiveStory);
    this.setState({
      activeStory: newActiveStory
    })
    if (story) {
      this.setState({
        activeGroup: story.group
      })
    }
  }

  handleStoryName(event) {
    const {stories, activeStory, activeGroup} = this.state;
    const story = stories.get(activeStory);
    const group = story ? story.group : activeGroup;
    const text = story ? story.text : '';
    const name = event.target.value;

    const newStory = {text: text, name: name, group: group};

    const newStories = new Map([...stories,
                              ...(new Map([[activeStory, newStory]]))]);

    this.setState({stories: newStories});
  }

  handleStoryText(event) {
    const {stories, activeStory, activeGroup} = this.state;
    const story = stories.get(activeStory);
    const group = story ? story.group : activeGroup;
    const name = story ? story.name : '';
    const text = event.target.value;

    const newStory = {text: text, name: name, group: group};

    const newStories = new Map([...stories,
                              ...(new Map([[activeStory, newStory]]))]);

    this.setState({stories: newStories});
  }

  toggleTextEdit() {
    const {textEdit} = this.state;
    this.setState({
      textEdit: !textEdit
    })
  }

  handleSelectGroup(g) {
    const { groups, activeIds, chanRender } = this.state;
    const { stories, activeStory } = this.state;
    const story = stories.get(activeStory);
    const storyName = story ? story.name : '';
    const storyText = story ? story.text : '';

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

      const newStory = {text: storyText, name: storyName, group: id};

      const newStories = new Map([...stories,
                                ...(new Map([[activeStory, newStory]]))]);

      this.setState({
        stories: newStories,
        groups: newGroups,
        activeGroup: id
      });
    }
    else {
      const newStory = {text: storyText, name: storyName, group: g.value};

      const newStories = new Map([...stories,
                                ...(new Map([[activeStory, newStory]]))]);

      this.setState({
        stories: newStories,
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

    const {groups, chanLabel} = this.state;

    const combo = Array.from(groups.entries()).map(kv => {
      const [k, v] = kv;
      const channels = v.activeIds.map(id => {
        return {
          'color': rgbToHex(v.chanRender.get(id).color),
          'range': v.chanRender.get(id).range,
          'label': chanLabel.get(id).label,
          'id': id
        } 
      });
      return {
        'label': v.label,
        'channels': channels
      };
    });

    const data = {
      'groups': combo
    }
  
    fetch('/api/render', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      }
    }).then(ok => {
      fetch('/api/yaml')
      .then(response => response.text())
      .then(data => {
        this.setState({
          yaml: data
        })
      })
    })
  }

  render() {
    const { img, groups, chanLabel, textEdit } = this.state;
    const { chanRender, activeIds, activeGroup } = this.state;
    const group = groups.get(activeGroup);
    let activeChanRender = new Map(activeIds.map(a => [a, chanRender.get(a)]))
    if (group) {
      activeChanRender = new Map(activeIds.map(a => [a, group.chanRender.get(a)]))
    }
    const activeChanLabel = new Map(activeIds.map(a => [a, chanLabel.get(a)]))
    const activeChannels = new Map(activeIds.map(a => [a, {
      ...activeChanLabel.get(a), ...activeChanRender.get(a)
    } ])) 
    const editLabel = textEdit ? 'Edit Groups' : 'Edit Story';

    const {stories, activeStory} = this.state;
    const story = stories.get(activeStory);
    const storyName = story ? story.name : '';
    const storyText = story ? story.text : '';

    return (

      <div className="container-fluid Repo">
        <ImageView className="ImageView"
          img={ img }
          channels={ activeChannels }
        />
        <div className="row justify-content-between">
          <div className="col-md-5">
            <button onClick={this.toggleTextEdit}>
              {editLabel}
            </button>
            <button onClick={this.renderGroups}>
              Render Groups
            </button>
            <CopyYaml
              text={this.state.yaml}
            />
            <CreatableSelect
              isClearable
              value={group}
              onChange={this.handleSelectGroup}
              options={Array.from(groups.values())}
            />
            <Controls 
              handleChange={this.handleChange}
              handleSelect={this.handleSelect}
              chanLabel={chanLabel}
              activeChanLabel={activeChanLabel}
              activeChannels={activeChannels}
              textEdit={textEdit}
              handleStoryName={this.handleStoryName}
              handleStoryText={this.handleStoryText}
              handleStoryChange={this.handleStoryChange}
              storyName={storyName}
              storyText={storyText}
              activeStory={activeStory}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default Repo;
