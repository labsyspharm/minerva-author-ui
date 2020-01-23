import React, { Component } from "react";
import CreatableSelect from 'react-select/creatable';

import MinervaImageView from "./minervaimageview";
import ImageView from "./imageview";
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

    const { width, height, channels, token, minerva, uuid, url } = props;

    const maxLevel = Math.ceil(Math.log2(Math.max(width, height) / 1024))

    this.state = {
			img: {
          uuid: uuid,
          width: width,
          height: height,
          maxLevel: maxLevel,
					url: url 
			},
      token: token,
      minerva: minerva,
      textEdit: false,
      viewport: null,
      activeStory: 0,
      stories: new Map([]),
      activeGroup: null,
      groups: new Map([]),
      activeIds: [0, 1],
      chanLabel: new Map(channels.map((v,k) => {
        return [k, {
          value: k, id: k,
          label: v,
        }];
      })),
      chanRender: new Map(channels.map((v,k) => {
        return [k, {
          maxRange: 65535,
          value: k, id: k,
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
    this.handleViewport = this.handleViewport.bind(this);
    this.toggleTextEdit = this.toggleTextEdit.bind(this);
    this.save = this.save.bind(this);
  }
  
  handleViewport(viewport) {
    const {stories, activeStory, activeGroup} = this.state;
    const story = stories.get(activeStory);
    const storyName = story ? story.name : '';
    const storyText = story ? story.text : '';
    const storyGroup = story ? story.group : activeGroup;

    const newStory = {
      'text': storyText,
      'name': storyName,
      'group': storyGroup,
      'zoom': viewport.getZoom(),
      'pan': [
        viewport.getCenter().x,
        viewport.getCenter().y
      ]
    }

    const newStories = new Map([...stories,
                              ...(new Map([[activeStory, newStory]]))]);
    
    this.setState({viewport: viewport});
    if (this.state.textEdit) {
      this.setState({stories: newStories});
    }
  }

  handleStoryChange(newActiveStory) {
    const {groups, stories, viewport} = this.state;
    const story = stories.get(newActiveStory);
    if (story && viewport) {
        const pan = new OpenSeadragon.Point(...story.pan);
        viewport.zoomTo(story.zoom); 
        viewport.panTo(pan); 
    }
    this.setState({
      activeStory: newActiveStory
    })
    if (story) {
      const group = groups.get(story.group)
      if (group) {
        this.setState({
          activeGroup: story.group,
          activeIds: group.activeIds
        })
      }
    }
  }

  handleStoryName(event) {
    const {stories, activeStory, activeGroup} = this.state;
    const story = stories.get(activeStory);
    const group = story ? story.group : activeGroup;
    const text = story ? story.text : '';
    const pan = story ? story.pan : [0.5, 0.5];
    const zoom = story ? story.zoom : 0.5;
    const name = event.target.value;

    const newStory = {
      text: text,
      name: name,
      group: group,
      pan: pan,
      zoom: zoom
    };

    const newStories = new Map([...stories,
                              ...(new Map([[activeStory, newStory]]))]);

    this.setState({stories: newStories});
  }

  handleStoryText(event) {
    const {stories, activeStory, activeGroup} = this.state;
    const story = stories.get(activeStory);
    const group = story ? story.group : activeGroup;
    const pan = story ? story.pan : [0.5, 0.5];
    const zoom = story ? story.zoom : 0.5;
    const name = story ? story.name : '';
    const text = event.target.value;

    const newStory = {
      text: text,
      name: name,
      group: group,
      pan: pan,
      zoom: zoom
    };

    const newStories = new Map([...stories,
                              ...(new Map([[activeStory, newStory]]))]);

    this.setState({stories: newStories});
  }

  toggleTextEdit() {
    const {textEdit, activeStory} = this.state;
    this.setState({
      textEdit: !textEdit
    })
    if (textEdit) {
      this.handleStoryChange(activeStory);
    }
  }

  handleSelectGroup(g) {
    const { groups, activeIds, chanRender } = this.state;
    const { stories, activeStory } = this.state;
    const story = stories.get(activeStory);
    const storyName = story ? story.name : '';
    const storyText = story ? story.text : '';
    const pan = story ? story.pan : [0.5, 0.5];
    const zoom = story ? story.zoom : 0.5;

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

      const newStory = {
        text: storyText,
        name: storyName,
        pan: pan,
        zoom: zoom,
        group: id
      };

      const newStories = new Map([...stories,
                                ...(new Map([[activeStory, newStory]]))]);

      this.setState({
        stories: newStories,
        groups: newGroups,
        activeGroup: id
      });
    }
    else {

      const newStory = {
        text: storyText,
        name: storyName,
        pan: pan,
        zoom: zoom,
        group: g.value
      };
      
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

  save() {

    let {groups} = this.state;
    const {stories, chanLabel} = this.state;
    const {minerva, token, img} = this.state;

    const group_output = Array.from(groups.values()).map(v => {
      const channels = v.activeIds.map(id => {
        const chan = v.chanRender.get(id);
        return {
          'color': rgbToHex(chan.color),
          'min': chan.range.min / chan.maxRange,
          'max': chan.range.max / chan.maxRange,
          'label': chanLabel.get(id).label,
          'id': id
        } 
      });
      let group_out = {
        'label': v.label,
        'channels': channels
      };
      if (v.id) {
        group_out.id = v.id;
      }
      console.log(group_out);
      return group_out
    });

    const story_output = Array.from(stories.values()).map(v => {
      return {
        'name': v.name,
        'text': v.text,
        'pan': v.pan,
        'zoom': v.zoom,
        'group': groups.get(v.group).label
      }
    });

    fetch('http://localhost:2020/api/stories', {
      method: 'POST',
      body: JSON.stringify({
        'stories': [{
          'name': '',
          'text': '',
          'waypoints': story_output
        }]
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (minerva) {
       fetch(img.url + img.uuid + '/rendering_settings', {
        method: 'POST',
        body: JSON.stringify({
          'groups': group_output
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": token
        }
      }).then(response => {
        return response.json();
      }).then(json => {
        json.groups.forEach((g,i) => {
          groups.get(i).id = g.id
        })
        this.setState({
          groups: groups
        })
        fetch('http://localhost:2020/api/minerva/yaml', {
          method: 'POST',
          body: JSON.stringify({
            'groups': json.groups,
            'image': {
              'url': img.url,
              'id': img.uuid,
              'width': img.width,
              'height': img.height,
              'maxLevel': img.maxLevel
            }
          }),
          headers: {
            "Content-Type": "application/json"
          }
        })
      });
    }
    else {
      fetch('http://localhost:2020/api/render', {
        method: 'POST',
        body: JSON.stringify({
          'groups': group_output
        }),
        headers: {
          "Content-Type": "application/json"
        }
      })
    }
  }

  render() {
    const { minerva, token } = this.state;
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

    let viewer;
    if (minerva) {
      viewer = <MinervaImageView className="ImageView"
        img={ img } token={ token }
        channels={ activeChannels }
        handleViewport={ this.handleViewport }
      />
    }
    else {
      viewer = <ImageView className="ImageView"
        img={ img }
        channels={ activeChannels }
        handleViewport={ this.handleViewport }
      />
    }

    return (

      <div className="container-fluid Repo">
        {viewer}
        <div className="row justify-content-between">
          <div className="col-md-5">
            <button onClick={this.toggleTextEdit}>
              {editLabel}
            </button>
            <button onClick={this.save}>
              Save
            </button>
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
