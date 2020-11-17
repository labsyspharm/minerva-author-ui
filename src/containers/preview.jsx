import React, { Component } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDoubleUp } from '@fortawesome/free-solid-svg-icons'
import Client from '../MinervaClient';
import MinervaBrowser from 'minerva-browser';
import '../style/preview.css';

class Preview extends Component {

  constructor(props) {
    super(props);

    this.browserRef = React.createRef();
    this.back = this.back.bind(this);
  }

  getToken() {
    return new Promise((resolve, reject) => {
      resolve(Client.getToken());
    });
  }

  componentDidMount() {
    console.log(this.props.story);
    let exhibit = this.buildExhibit(this.props.story);
    console.log(JSON.stringify(exhibit, null, 2));
    MinervaBrowser.build_page({
      exhibit: exhibit,
      id: this.browserRef.current.id,
      authenticate: this.getToken,
      embedded: true,
      speech_bucket: '',
      hideWelcome: true
    });
  }

  back() {
    window.history.replaceState({}, document.title, "/");
    this.props.onBack();
  }

  render() {
    return (
      <div className="full-height">
        <button className="ui button small preview-back-button" onClick={this.back} >
          <FontAwesomeIcon icon={faAngleDoubleUp} />&nbsp;
          Close Preview
          </button>

          <div ref={this.browserRef} id="minerva-browser"></div>
      </div>
    );
  }

  buildExhibit(story) {
    console.log(story);
    let Exhibit = {};
    Exhibit.Name = story.sample_info.name;
    Exhibit.Header = story.sample_info.text;
    Exhibit.Images = this.buildImages(story),
    Exhibit.Layout = {
      "Grid": [["i0"]]
    };
    Exhibit.Groups = this.buildGroups(story),
    Exhibit.Stories = this.buildStories(story)
    Exhibit.Rotation = 0;
    return Exhibit;
  }

  buildImages(story) {
    return [
      {
        "Name": "i0",
        "Description": story.sample_info.name,
        "Provider": "minerva",
        "Path": Client.baseUrl + '/image/' + story.imageUuid + '/render-tile/',
        "Width": this.props.image.width,
        "Height": this.props.image.height,
        "MaxLevel": this.props.image.pyramid_levels
      }
    ];
  }

  buildGroups(story) {
    let groupList = [];
    for (let group of story.groups) {
      groupList.push({
        "Path": group.label,
        "Name": group.label,
        "Colors": this.buildColors(group),
        "Channels": this.buildGroupChannels(group),
        "Render": this.buildRenderSettings(group)
      });
    }
    return groupList;
  }

  buildRenderSettings(group) {
    return group.render.map(channel => {
      return {
        Color: channel.color,
        Images: ["i0"],
        Range: [channel.min, channel.max],
        Index: channel.id
      }
    });
  }

  buildColors(group) {
    return group.channels.map(channel => {
      return channel.color;
    });
  }

  buildGroupChannels(group) {
    return group.channels.map(channel => {
      return channel.label;
    });
  }

  buildStories(story) {
    let storyList = [{
      "Name": story.sample_info.name,
      "Waypoints": []
    }];
    for (let waypoint of story.waypoints) {
      storyList[0].Waypoints.push({
        "Name": waypoint.name,
        "Description": waypoint.text,
        "Arrows": this.buildArrows(waypoint),
        "Overlays": this.buildOverlays(waypoint),
        "Group": waypoint.group,
        "Zoom": waypoint.zoom,
        "Pan": waypoint.pan
      })
    }
    return storyList;
  }

  buildArrows(waypoint) {
    let arrows = [];
    for (let arrow of waypoint.arrows) {
      arrows.push({
        "Text": arrow.text,
        "HideArrow": arrow.hide,
        "Point": arrow.position,
        "Angle": waypoint.angle
      });
    }
    return arrows;
  }

  buildOverlays(waypoint) {
    let overlays = [];
    for (let overlay of waypoint.overlays) {
      overlays.push({
        "x": overlay[0],
        "y": overlay[1],
        "width": overlay[2],
        "height": overlay[3]
      });
    }
    return overlays;
  }
}

export default Preview;