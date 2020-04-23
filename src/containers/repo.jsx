import React, { Component } from "react";
import CreatableSelect from 'react-select/creatable';

import MinervaImageView from "./minervaimageview";
import Modal from "../components/modal";
import ImageView from "./imageview";
import Controls from "./controls";
import { Confirm } from 'semantic-ui-react';
import ClipLoader from "react-spinners/ClipLoader";
import { Progress, Popup } from 'semantic-ui-react'
import Client from '../MinervaClient';

import '../style/repo'

const validNameRegex = /^([a-zA-Z0-9 _-]+)$/;

const randInt = n => Math.floor(Math.random() * n);
const randColor = () => {
  return [
    [0,0,255],[0,127,255],[0,255,0],[0,255,127],[0,255,255],
    [127,0,255],[127,127,127],[127,127,255],[127,255,0],[127,255,127],
    [255,0,0],[255,0,127],[255,0,255],[255,127,0],[255,127,127],[255,255,0]
  ][randInt(16)]
}

const normalize = (viewer, pixels) => {
  const vp = viewer.viewport;
  const norm = vp.viewerElementToViewportCoordinates;
  return norm.call(vp, pixels);
}

const IntToHex = c => {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

const rgbToHex = rgb => {
  const [r, g, b] = rgb;
  return IntToHex(r) + IntToHex(g) + IntToHex(b);
}

const hexToRgb = hex => {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function(m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
   	parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

class Repo extends Component {

  constructor(props) {
    super();

    const { width, height, token, minerva, uuid, url } = props;
    const { channels, sample_info, waypoints, groups } = props;

    const maxLevel = Math.ceil(Math.log2(Math.max(width, height) / 1024))

		const defaultChanRender = new Map(channels.map((v,k) => {
			return [k, {
				maxRange: 65535,
				value: k, id: k,
				color: randColor(),
				range: {min: 0, max: 32768},
        visible: true
			}];
		}));

		this.state = {
      sampleName: sample_info.name,
      sampleText: sample_info.text,
      drawType: '',
      drawing: 0,
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
      showModal: false,
      sampleInfo: false,
      renameModal: false,
      addGroupModal: false,
      needNewGroup: false,
			activeArrow: 0,
      viewport: null,
      activeStory: 0,
      deleteGroupModal: false,
      deleteStoryModal: false,
      saving: false,
      saveProgress: 0,
      saveProgressMax: 0,
      stories: new Map(waypoints.map((v,k) => {
				return [k, {
					'name': v.name,
        	'text': v.text,
        	'pan': v.pan,
        	'zoom': v.zoom,
        	'arrows': v.arrows,
        	'overlays': v.overlays,
        	'group': groups.findIndex(g => {
						return g.label == v.group;
					})
				}]
			})),
      activeGroup: null,
      groups: new Map(groups.map((v,k) => {
				return [k, {
					activeIds: v.channels.map(chan => {
						return chan.id;
					}),
					chanRender: new Map([...defaultChanRender,
					...new Map(v.channels.map(chan => {
						return [chan.id, {
							color: hexToRgb(chan.color),
							range: {
								min: chan.min * 65535, 
								max: chan.max * 65535
							},
							maxRange: 65535,
							value: chan.id, id: chan.id,
              visible: true
						}]
					}))]),
					label: v.label,
					value: k
				}]
			})),
      activeIds: [0, 1],
      chanLabel: new Map(channels.map((v,k) => {
        return [k, {
          value: k, id: k,
          label: v,
        }];
      })),
      chanRender: defaultChanRender
    };

    // Bind
    this.interactor = this.interactor.bind(this);
    this.arrowClick = this.arrowClick.bind(this);
    this.lassoClick = this.lassoClick.bind(this);
    this.deleteArrow = this.deleteArrow.bind(this);
    this.deleteOverlay = this.deleteOverlay.bind(this);
    this.addArrowText = this.addArrowText.bind(this);
    this.boxClick = this.boxClick.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.handleSelectStory = this.handleSelectStory.bind(this);
    this.handleStoryName = this.handleStoryName.bind(this);
    this.handleStoryText = this.handleStoryText.bind(this);
    this.handleArrowText = this.handleArrowText.bind(this);
    this.handleSampleText = this.handleSampleText.bind(this);
    this.handleSampleName = this.handleSampleName.bind(this);
    this.handleArrowHide = this.handleArrowHide.bind(this);
    this.handleArrowAngle = this.handleArrowAngle.bind(this);
    this.handleStoryChange = this.handleStoryChange.bind(this);
    this.handleStoryInsert = this.handleStoryInsert.bind(this);
    this.handleStoryRemove = this.handleStoryRemove.bind(this);
    this.deleteStory = this.deleteStory.bind(this);
    this.handleSelectGroup = this.handleSelectGroup.bind(this);
    this.handleViewport = this.handleViewport.bind(this);
    this.toggleTextEdit = this.toggleTextEdit.bind(this);
    this.toggleSampleInfo = this.toggleSampleInfo.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.save = this.save.bind(this);
    this.deleteActiveGroup = this.deleteActiveGroup.bind(this);
    this.showRenameModal = this.showRenameModal.bind(this);
    this.showAddGroupModal = this.showAddGroupModal.bind(this);
    this.handleGroupRename = this.handleGroupRename.bind(this);
    this.handleAddGroup = this.handleAddGroup.bind(this);
    this.getCreateLabel = this.getCreateLabel.bind(this);
  }
  
  handleViewport(viewport) {
    const {stories, activeStory, activeGroup} = this.state;
    const story = stories.get(activeStory);
    const storyName = story ? story.name : '';
    const storyText = story ? story.text : '';
    const storyGroup = story ? story.group : activeGroup;
    const overlays = story ? story.overlays : [];
    const arrows = story ? story.arrows : [];

    const newStory = {
      'text': storyText,
      'name': storyName,
      'group': storyGroup,
      'arrows': arrows,
      'overlays': overlays,
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

  handleStoryRemove() {

    const {stories, activeStory} = this.state;
    const story = stories.get(activeStory);
    if (story === undefined) {
      this.deleteStory();
    }
    else {
      this.setState({deleteStoryModal: true})
    }

  }

  deleteStory() {

    const {stories, activeStory} = this.state;

    const newStories = new Map([...stories].filter(([k,v]) => {
                                return k != activeStory;
                              }).map(([k,v])=>{
                                return [k < activeStory? k : k - 1, v]
                              }))

    this.setState({stories: newStories, activeStory: Math.max(0, activeStory - 1)});
    this.setState({deleteStoryModal: false})
  }

  handleStoryInsert() {
    const {stories, activeStory, activeGroup, viewport} = this.state;

     const newStory = {
      text: '',
      name: '',
      arrows: [],
      overlays: [],
      group: activeGroup,
      pan: [viewport.getCenter().x, viewport.getCenter().y],
      zoom: viewport.getZoom()
    };

    const newStories = new Map([...[...stories].map(([k,v]) => {
                                return [k <= activeStory? k: k+1, v];
                              }),
                              ...(new Map([[activeStory + 1, newStory]]))]);

    this.setState({stories: newStories, activeStory: activeStory + 1});
  }

  handleStoryName(event) {
    const {stories, activeStory, activeGroup, viewport} = this.state;
    const story = stories.get(activeStory);
    const overlays = story ? story.overlays : [];
    const arrows = story ? story.arrows : [];
    const group = story ? story.group : activeGroup;
    const text = story ? story.text : '';
    const pan = story ? story.pan : [viewport.getCenter().x, viewport.getCenter().y]
    const zoom = story ? story.zoom : viewport.getZoom();
    const name = event.target.value;

    const newStory = {
      text: text,
      name: name,
      arrows: arrows,
      overlays: overlays,
      group: group,
      pan: pan,
      zoom: zoom
    };

    const newStories = new Map([...stories,
                              ...(new Map([[activeStory, newStory]]))]);

    this.setState({stories: newStories});
  }

  handleStoryText(event) {
    const {stories, activeStory, activeGroup, viewport} = this.state;
    const story = stories.get(activeStory);
    const overlays = story ? story.overlays : [];
    const arrows = story ? story.arrows : [];
    const group = story ? story.group : activeGroup;
    const pan = story ? story.pan : [viewport.getCenter().x, viewport.getCenter().y]
    const zoom = story ? story.zoom : viewport.getZoom();
    const name = story ? story.name : '';
    const text = event.target.value;

    const newStory = {
      text: text,
      name: name,
      arrows: arrows,
      overlays: overlays,
      group: group,
      pan: pan,
      zoom: zoom
    };

    const newStories = new Map([...stories,
                              ...(new Map([[activeStory, newStory]]))]);

    this.setState({stories: newStories});
  }

	toggleModal() {
	  this.setState({
      showModal: !this.state.showModal
    });
	}

	toggleSampleInfo() {
	  this.setState({
      sampleInfo: !this.state.sampleInfo
    });
	}

  toggleTextEdit(value) {
    const {textEdit, activeStory} = this.state;
    this.setState({
      textEdit: value,
      saveProgress: 0,
      saveProgressMax: 0
    })
    if (!textEdit) {
      this.handleStoryChange(activeStory);
    }
  }

  showAddGroupModal() {
    this.setState({ needNewGroup: !this.state.addGroupModal});
    this.setState({ addGroupModal: !this.state.addGroupModal});
  }

  showRenameModal() {
    this.setState({ renameModal: !this.state.renameModal});
  }

  validateChannelGroupLabel(label) {
    return label && validNameRegex.test(label);
  }

  handleAddGroup(evt) {
    if (!this.validateChannelGroupLabel(evt.target.value)) {
      this.setState({invalidChannelGroupName: true});
      return;
    }
    this.setState({invalidChannelGroupName: false});
    let groups = this.state.groups;
    if (this.state.needNewGroup) {
      const id = groups.size;
      const newGroup = {
        chanRender: this.state.chanRender,
        activeIds: this.state.activeIds,
        label: evt.target.value,
        value: id
      }
    
      const newGroups = new Map([...groups,
                                ...(new Map([[id, newGroup]]))]);

      this.setState({
        needNewGroup: false,
        groups: newGroups,
        activeGroup: id
      });
    }
    else {
      this.handleGroupRename(evt);
    }
  }

  handleGroupRename(evt) {
    if (!this.validateChannelGroupLabel(evt.target.value)) {
      this.setState({invalidChannelGroupName: true});
      return;
    }
    this.setState({invalidChannelGroupName: false});

    let group = this.state.groups.get(this.state.activeGroup);
    let newGroups = new Map(this.state.groups);
    group.label = evt.target.value;
    newGroups.set(this.state.activeGroup, group);
    this.setState({groups: newGroups});
  }

  deleteActiveGroup() {
    this.state.groups.delete(this.state.activeGroup);
    const newGroups = new Map();
    // All groups that come after the deleted group, must have their
    // indexes reduced by one, so that there are no gaps.
    for (let [key, value] of this.state.groups.entries()) {
      if (key > this.state.activeGroup) {
        key--;
        value.value--;
      }
      newGroups.set(key, value);
    }
    let newActiveGroup = this.state.activeGroup - 1;
    if (newActiveGroup < 0) {
      newActiveGroup = 0;
    }
    let selectedGroup = newGroups.get(newActiveGroup);
    let newActiveIds = selectedGroup ? selectedGroup.activeIds : [0, 1];
    this.setState({groups: newGroups, 
      activeGroup: newActiveGroup,
      deleteGroupModal: false,
      activeIds: newActiveIds });
  }

  handleSelectStory(s) {
    this.handleStoryChange(s.value);
  }


  handleSelectGroup(g, action) {
    if (action.action === 'clear') {
      this.setState({deleteGroupModal: true});
      return;
    }

    const id = this._handleSelectGroupForEditing(g);
    this._handleSelectGroupForWaypoint(id);
  }

  _handleSelectGroupForWaypoint(id) {
    const {activeStory, textEdit, viewport} = this.state;
    const story = this.state.stories.get(activeStory);
    if ((id !== undefined) && textEdit) {

      const overlays = story ? story.overlays : [];
      const arrows = story ? story.arrows : [];
      const text = story ? story.text : '';
      const pan = story ? story.pan : [viewport.getCenter().x, viewport.getCenter().y]
      const zoom = story ? story.zoom : viewport.getZoom();
      const name = story ? story.name : '';

      const newStory = {
        text: text,
        name: name,
        arrows: arrows,
        overlays: overlays,
        group: id,
        pan: pan,
        zoom: zoom
      };

      const newStories = new Map([...this.state.stories,
        ...(new Map([[activeStory, newStory]]))]);
      this.setState({ stories: newStories});
    }
  }

  _handleSelectGroupForEditing(g) {
    let groups = this.state.groups;
    if (g.__isNew__) {
      if (!this.validateChannelGroupLabel(g.label)) {
        return undefined;
      }
      const id = groups.size;
      const newGroup = {
        chanRender: this.state.chanRender,
        activeIds: this.state.activeIds,
        label: g.label,
        value: id
      }
    
      const newGroups = new Map([...groups,
                                ...(new Map([[id, newGroup]]))]);

      this.setState({
        groups: newGroups,
        activeGroup: id
      });
      return id;
    }
    else {
      this.setState({
        activeGroup: g.value,
        activeIds: g.activeIds
      });
      return g.value;
    }
    return true;
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

  computeBounds(value, start, len) {
    const center = start + (len / 2);
    const end = start + len;
    // Below center
    if (value < center) {
      return {
        start: value,
        range: end - value,
      };
    }
    // Above center
    return {
      start: start,
      range: value - start,
    };
  }

  handleArrowAngle(event) {

    const {stories, activeStory, activeGroup, viewport} = this.state;
    const story = stories.get(activeStory);
    const group = story ? story.group : activeGroup;
    const overlays = story ? story.overlays : [];
    const arrows = story ? story.arrows : [];
    const text = story ? story.text : '';
    const name = story ? story.name : '';
    const pan = story ? story.pan : [viewport.getCenter().x, viewport.getCenter().y]
    const zoom = story ? story.zoom : viewport.getZoom();
		
		const activeArrow = this.state.activeArrow;

		if (arrows.length - 1 < activeArrow) {
			return;
		}
	
    let angle = parseInt(event.target.value)
    arrows[activeArrow].angle = isNaN(angle) ? '' : angle; 

    const newStory = {
      text: text,
      name: name,
      overlays: overlays,
      arrows: arrows,
      group: group,
      pan: pan,
      zoom: zoom
    };

    const newStories = new Map([...stories,
                              ...(new Map([[activeStory, newStory]]))]);

    this.setState({
      stories: newStories
    })
  }

  handleArrowHide() {

    const {stories, activeStory, activeGroup, viewport} = this.state;
    const story = stories.get(activeStory);
    const group = story ? story.group : activeGroup;
    const overlays = story ? story.overlays : [];
    const arrows = story ? story.arrows : [];
    const text = story ? story.text : '';
    const name = story ? story.name : '';
    const pan = story ? story.pan : [viewport.getCenter().x, viewport.getCenter().y]
    const zoom = story ? story.zoom : viewport.getZoom();
		
		const activeArrow = this.state.activeArrow;

		if (arrows.length - 1 < activeArrow) {
			return;
		}
	
		arrows[activeArrow].hide = !arrows[activeArrow].hide;

    const newStory = {
      text: text,
      name: name,
      overlays: overlays,
      arrows: arrows,
      group: group,
      pan: pan,
      zoom: zoom
    };

    const newStories = new Map([...stories,
                              ...(new Map([[activeStory, newStory]]))]);

    this.setState({
      stories: newStories
    })
  }

  handleSampleName(event) {
    this.setState({
      sampleName: event.target.value
    })
  }

  handleSampleText(event) {
    this.setState({
      sampleText: event.target.value
    })
  }

  handleArrowText(event) {

    const {stories, activeStory, activeGroup, viewport} = this.state;
    const story = stories.get(activeStory);
    const group = story ? story.group : activeGroup;
    const overlays = story ? story.overlays : [];
    const arrows = story ? story.arrows : [];
    const text = story ? story.text : '';
    const name = story ? story.name : '';
    const pan = story ? story.pan : [viewport.getCenter().x, viewport.getCenter().y]
    const zoom = story ? story.zoom : viewport.getZoom();
		
		const activeArrow = this.state.activeArrow;

		if (arrows.length - 1 < activeArrow) {
			return;
		}
	
		arrows[activeArrow].text = event.target.value;

    const newStory = {
      text: text,
      name: name,
      overlays: overlays,
      arrows: arrows,
      group: group,
      pan: pan,
      zoom: zoom
    };

    const newStories = new Map([...stories,
                              ...(new Map([[activeStory, newStory]]))]);

    this.setState({
      stories: newStories
    })
  }

  drawArrow(position) {
    const new_xy = [
      position.x, position.y
    ];

    const {stories, activeStory, activeGroup, viewport} = this.state;
    const story = stories.get(activeStory);
    const group = story ? story.group : activeGroup;
    const overlays = story ? story.overlays : [];
    const arrows = story ? story.arrows : [];
    const text = story ? story.text : '';
    const name = story ? story.name : '';
    const pan = story ? story.pan : [viewport.getCenter().x, viewport.getCenter().y]
    const zoom = story ? story.zoom : viewport.getZoom();

    const newStory = {
      text: text,
      name: name,
      overlays: overlays,
      arrows: arrows.concat([{
				position: new_xy,
        hide: false,
        angle: '',
				text: ''
			}]),
      group: group,
      pan: pan,
      zoom: zoom
    };

    const newStories = new Map([...stories,
                              ...(new Map([[activeStory, newStory]]))]);

    this.setState({
      stories: newStories
    })
  }


  drawLowerBounds(position) {
    const wh = [0, 0];
    const new_xy = [
      position.x, position.y
    ];
    const newOverlay = new_xy.concat(wh);

    const {stories, activeStory, activeGroup, viewport} = this.state;
    const story = stories.get(activeStory);
    const group = story ? story.group : activeGroup;
    const text = story ? story.text : '';
    const name = story ? story.name : '';
    const pan = story ? story.pan : [viewport.getCenter().x, viewport.getCenter().y]
    const zoom = story ? story.zoom : viewport.getZoom();
    const arrows = story ? story.arrows : [];
    const overlays = story ? story.overlays : [];

    const newStory = {
      text: text,
      name: name,
      arrows: arrows,
      overlays: overlays.concat([newOverlay]),
      group: group,
      pan: pan,
      zoom: zoom
    };

    const newStories = new Map([...stories,
                              ...(new Map([[activeStory, newStory]]))]);

    this.setState({
      stories: newStories
    })
  }

  drawUpperBounds(position) {
    const {stories, activeStory, activeGroup, viewport} = this.state;
    const story = stories.get(activeStory);
    const overlays = story ? story.overlays: [];
		const overlay = overlays.pop();

    const xy = overlay.slice(0, 2);
    const wh = overlay.slice(2);

    // Set actual bounds
    const x = this.computeBounds(position.x, xy[0], wh[0]);
    const y = this.computeBounds(position.y, xy[1], wh[1]);

    const newOverlay = [x.start, y.start, x.range, y.range];

    const group = story ? story.group : activeGroup;
    const text = story ? story.text : '';
    const name = story ? story.name : '';
    const pan = story ? story.pan : [viewport.getCenter().x, viewport.getCenter().y]
    const zoom = story ? story.zoom : viewport.getZoom();
    const arrows = story ? story.arrows : [];

    const newStory = {
      text: text,
      name: name,
      arrows: arrows,
      overlays: overlays.concat([newOverlay]),
      group: group,
      pan: pan,
      zoom: zoom
    };

    const newStories = new Map([...stories,
                              ...(new Map([[activeStory, newStory]]))]);

    this.setState({
      stories: newStories
    });
  }

  addArrowText(i) {
    this.setState({
      showModal: true,
			activeArrow: i
    })
  }

	deleteArrow(i) {
    const {stories, activeStory, activeArrow} = this.state;
    let newStory = stories.get(activeStory);

		newStory.arrows.splice(i, 1);

		if (i <= activeArrow) {
			this.setState({
				activeArrow: Math.max(0, activeArrow - 1)
			})
		}

    const newStories = new Map([...stories,
                              ...(new Map([[activeStory, newStory]]))]);

    this.setState({
      stories: newStories
    });
	}

	deleteOverlay(i) {
    const {stories, activeStory} = this.state;
    let newStory = stories.get(activeStory);

		newStory.overlays.splice(i, 1);

	  const newStories = new Map([...stories,
                              ...(new Map([[activeStory, newStory]]))]);

    this.setState({
      stories: newStories
    });
	}

  interactor(viewer) {
    viewer.addHandler('canvas-click', function(e) {
      const THIS = e.userData;
      const {drawing, drawType} = THIS.state;

      if (drawType == "arrow") {
        if (drawing == 1) {
          const position = normalize(viewer, e.position);
          THIS.drawArrow(position);
          e.preventDefaultAction = true;
          viewer.setMouseNavEnabled(true);
          THIS.setState({drawing: 0, drawType: ''})
        }
        return;
      }
    }, this);

    viewer.addHandler('canvas-drag', function(e) {
      const THIS = e.userData;
      const {drawing, drawType} = THIS.state;

      if (drawType != "box") {
        return;
      }

      const position = normalize(viewer, e.position);

      if (drawing == 1) {
        THIS.setState({drawing: 2})
        e.preventDefaultAction = true;
        THIS.drawLowerBounds(position);
      }
      else if (drawing == 2) {
        e.preventDefaultAction = true;
        THIS.drawUpperBounds(position);
      }
    }, this);

    viewer.addHandler('canvas-drag-end', function(e) {
      const THIS = e.userData;
      const {drawing, drawType} = THIS.state;

      if (drawType != "box") {
        return;
      }

      const position = normalize(viewer, e.position);

      if (drawing == 2) {
        e.preventDefaultAction = true;
        THIS.drawUpperBounds(position);
        THIS.setState({drawing: 0, drawType: ''})
      }
    }, this);


  }
  arrowClick() {
    const {drawType} = this.state;
    const _drawType = (drawType == 'arrow')? '' : 'arrow';
    this.setState({drawType: _drawType});
    const _drawing = (_drawType == '')? 0 : 1;
    this.setState({drawing: _drawing});
  }
  lassoClick() {
    const {drawType} = this.state;
    const _drawType = (drawType == 'lasso')? '' : 'lasso';
    this.setState({drawType: _drawType});
    const _drawing = (_drawType == '')? 0 : 1;
    this.setState({drawing: _drawing});
  }
  boxClick() {
    const {drawType} = this.state;
    const _drawType = (drawType == 'box')? '' : 'box';
    this.setState({drawType: _drawType});
    const _drawing = (_drawType == '')? 0 : 1;
    this.setState({drawing: _drawing});
  }
  handleChange(id, color, range, label, visible) {
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
    if (visible !== null) {
      newRender['visible'] = visible;
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

    const newChanRender = new Map([...chanRender,
                               ...(new Map([[id, newRender]]))]);
    this.setState({
      chanRender: newChanRender,
    });
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
      return group_out
    });

    const story_output = Array.from(stories.values()).map(v => {
      return {
        'name': v.name,
        'text': v.text,
        'pan': v.pan,
        'zoom': v.zoom,
        'arrows': v.arrows,
        'overlays': v.overlays,
        'group': groups.get(v.group).label
      }
    });

    this.setState({saving: true});

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
      Client.createRenderingSettings(img.uuid, { groups: group_output }).then(json => {
        this.setState({saving: false});
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
      let render = fetch('http://localhost:2020/api/render', {
        method: 'POST',
        body: JSON.stringify({
          'groups': group_output,
          'header': this.state.sampleText,
          'image': {
            'description': this.state.sampleName
          }
        }),
        headers: {
          "Content-Type": "application/json"
        }
      })

			let save = fetch('http://localhost:2020/api/save', {
				method: 'POST',
				body: JSON.stringify({
					'waypoints': story_output,
					'groups': group_output,
          'sample_info': {
            'name': this.state.sampleName,
            'text': this.state.sampleText
          }
				}),
				headers: {
					"Content-Type": "application/json"
				}
      })

      this.setProgressPolling(true);
      
      Promise.all([render, save]).then(res => {
        this.setState({saving: false});
        this.setProgressPolling(false);
        this.getSaveProgress();
      }).catch(err => {
        console.error(err);
        this.setState({saving: false});
        this.setProgressPolling(false);
      })
    }
  }

  setProgressPolling(poll) {
    if (poll) {
      this.progressInterval = setInterval(() => {
        this.getSaveProgress();
      }, 500);
    } else {
      clearInterval(this.progressInterval);
    }
  }

  getSaveProgress() {
    fetch('http://127.0.0.1:2020/api/render/progress').then(response => {
      return response.json();
    }).then(progress => {
      this.setState({
        saveProgress: progress.progress,
        saveProgressMax: progress.max
      });
    });
  }

  getCreateLabel(label) {
    if (!this.validateChannelGroupLabel(label)) {
      return "Name contains invalid characters.";
    }
    return "Create Group: " + label;
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
    const visibleChannels = new Map(
      [...activeChannels].filter(([k, v]) => v.visible)
    );

    const {stories, activeStory} = this.state;
    const story = stories.get(activeStory);
    const storyName = story ? story.name : '';
    const storyText = story ? story.text : '';
    const overlays = story ? story.overlays : [];
    const arrows = story ? story.arrows : [];
		const activeArrow = this.state.activeArrow;
		let arrowText = '';
		if (arrows.length > 0) {
			arrowText = arrows[activeArrow].text;
		}
		let arrowAngle = '';
		if (arrows.length > 0) {
			arrowAngle = arrows[activeArrow].angle;
		}
		let arrowHidden = false;
		if (arrows.length > 0) {
			arrowHidden = arrows[activeArrow].hide;
		}

    let viewer;
    if (minerva) {
      viewer = <MinervaImageView className="ImageView"
        img={ img } token={ token }
        channels={ visibleChannels }
        overlays={ overlays } arrows={ arrows }
        handleViewport={ this.handleViewport }
        interactor={ this.interactor }
      />
    }
    else {
      viewer = <ImageView className="ImageView"
        img={ img }
        channels={ visibleChannels }
        overlays={ overlays } arrows={ arrows }
        handleViewport={ this.handleViewport }
        interactor={ this.interactor }
      />
    }

    let saveButton = ''
    if (group != undefined) {
      saveButton = (
        <button className="ui button primary" onClick={this.save} disabled={this.state.saving}>
          Save&nbsp;
          <ClipLoader animation="border"
          size={12} color={"#FFFFFF"}
          loading={this.state.saving}/>
        </button>
      )
    }
    let editGroupsButton = this.state.textEdit ? "ui button" : "ui button active";
    let editStoryButton = this.state.textEdit ? "ui button active" : "ui button";

    return (

      <div className="container-fluid Repo">
        {viewer}
				<Modal toggle={this.toggleModal}
					show={this.state.showModal}>
            <button className="ui button compact" onClick={this.handleArrowHide}>
            {arrowHidden? 'Show Arrow' : 'Hide Arrow'}
            </button>
            <form className="ui form" onSubmit={this.toggleModal}>
              <input type='text' placeholder='Arrow Angle'
              value={arrowAngle} onChange={this.handleArrowAngle}
              />
						  <textarea placeholder='Arrow Description' value={arrowText}
						  onChange={this.handleArrowText} />
            </form>
				</Modal>

				<Modal toggle={this.toggleSampleInfo}
					show={this.state.sampleInfo}>
            <form className="ui form" onSubmit={this.toggleSampleInfo}>
              <input type='text' placeholder='Sample Name'
              value={this.state.sampleName} onChange={this.handleSampleName}
              />
						  <textarea placeholder='Sample Description' value={this.state.sampleText}
						  onChange={this.handleSampleText} />
            </form>
				</Modal>

        <div className="row justify-content-between">
          <div className="col-md-6">
              <button className="ui button compact" onClick={() => this.toggleSampleInfo()}>
              Sample Info
              </button>
            <span className="ui buttons">
              <button className={editGroupsButton} onClick={() => this.toggleTextEdit(false)}>
                Edit Groups
              </button>
              <button className={editStoryButton} onClick={() => this.toggleTextEdit(true)}>
                Edit Story
              </button>
              {saveButton}
            </span>
            {this.renderProgressBar()}
            <div className="row bg-trans">
              <div className="col-5 pr-0">
                  <div className="font-white">
                    Channel Groups:
                  </div>
                  <CreatableSelect
                  isClearable
                  value={group}
                  onChange={this.handleSelectGroup}
                  options={Array.from(groups.values())}
                  formatCreateLabel={this.getCreateLabel}
                />
              </div>
              <div className="col-7 pl-0 pr-0 pt-3">
                <span className="ui buttons">
                  {this.renderAddGroupModal()}
                  {this.renderRenameModal()}
                </span>
              </div>
            </div>
            <Controls 
              stories={this.state.stories}
							addArrowText={this.addArrowText}
							deleteArrow={this.deleteArrow}
							deleteOverlay={this.deleteOverlay}
              drawType = {this.state.drawType}
              arrowClick = {this.arrowClick}
              lassoClick = {this.lassoClick}
              boxClick = {this.boxClick}
              handleChange={this.handleChange}
              handleSelect={this.handleSelect}
              handleSelectStory={this.handleSelectStory}
              chanLabel={chanLabel}
              activeChanLabel={activeChanLabel}
              activeChannels={activeChannels}
              textEdit={textEdit}
              handleStoryName={this.handleStoryName}
              handleStoryText={this.handleStoryText}
              handleStoryChange={this.handleStoryChange}
              handleStoryInsert={this.handleStoryInsert}
              handleStoryRemove={this.handleStoryRemove}
							overlays={overlays}
							arrows={arrows}
              storyName={storyName}
              storyText={storyText}
              activeStory={activeStory}
            />
            <Confirm
              header="Delete channel group" 
              content="Are you sure?"
              confirmButton="Delete"
              size="small"
              open={this.state.deleteGroupModal}
              onCancel={() => { this.setState({deleteGroupModal: false})} }
              onConfirm={this.deleteActiveGroup}
            />
            <Confirm
              header="Delete waypoint"
              content="Are you sure?"
              confirmButton="Delete"
              size="small"
              open={this.state.deleteStoryModal}
              onCancel={() => { this.setState({deleteStoryModal: false})} }
              onConfirm={this.deleteStory}
            />
          </div>
        </div>
      </div>
    );
  }

  renderAddGroupModal() {
    return (
      <div className="">
        <button className="ui button compact ml-1 mr-1" onClick={this.showAddGroupModal}>Add Group</button>
        <Modal show={this.state.addGroupModal} toggle={this.showAddGroupModal}>
        <form className="ui form" onSubmit={this.showAddGroupModal}>
          <label className="ui label">Add group</label>
           <Popup
            trigger={<input type="text" onChange={this.handleAddGroup} />}
            open={this.state.invalidChannelGroupName} 
            content='Channel group name can contain only letters, numbers, space, dash or underscore.'
            position='top center'
          />
        </form>
        </Modal>
      </div>
    );
  }

  renderRenameModal() {
    let group = this.state.groups.get(this.state.activeGroup);
    if (!group) {
      return null;
    }
    return (
      <div className="all-pointer">
        <button className="ui button compact" onClick={this.showRenameModal}>Rename</button>
        <Modal show={this.state.renameModal} toggle={this.showRenameModal}>
        <form className="ui form" onSubmit={this.showRenameModal}>
          <label className="ui label">Rename group</label>
          <Popup
            trigger={<input type="text" value={group.label} onChange={this.handleGroupRename} />}
            open={this.state.invalidChannelGroupName} 
            content='Channel group name can contain only letters, numbers, space, dash or underscore.'
            position='top center'
        />
          
        </form>
        </Modal>
      </div>
    );
  }

  renderProgressBar() {
    if (this.state.saveProgress <= 0) {
      return null;
    }
    let percent = Math.round(this.state.saveProgress/this.state.saveProgressMax*100);
    return (
      <div className="row">
        <div className="col">
          <Progress percent={percent} color='blue' progress autoSuccess active />
        </div>
      </div>
    );
  }
}

export default Repo;
