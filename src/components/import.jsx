import {CSSTransitionGroup} from 'react-transition-group';
import React, { Component } from "react";
import ImageList from "./imagelist"
import Tick from "./tick"

class Import extends Component {

  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.renderImage = this.renderImage.bind(this);

    this.state = {
      show: true
    };
  }

  toggle() {
    const {show} = this.state;

    this.setState({
      show: !show
    });
  }

  renderImage(uuid) {
    const {imgs, click} = this.props;
    const img = imgs.get(uuid);

    return (
      <Tick key={uuid} className="Tick"
        onClick={() => click(img)}>
        {img.name}
      </Tick>
    );
  }

  /**
   * @param {Map} imgs - From uuid to img
   * @param {Object} imp
   * @param {function} click
   */
  render() {

    const {show} = this.state;
    const {imp} = this.props;
    const {imgs} = imp;

    var items;
    var tickState = "Tick";
    if (show) {
      tickState = "Tick TickOpen";
      items = <ImageList> {imgs.map(this.renderImage)} </ImageList>;
    }

    return (
      <div>
        <Tick className={tickState}
          onClick={this.toggle}>
          <svg viewBox="0 0 10 10" 
            width="1em" height="1em">
            <path stroke="white" d="M 0,4 L 3,7 L 6,4"></path>
          </svg>
          {imp.name}
        </Tick>
        <CSSTransitionGroup transitionName="items">
          {items}
        </CSSTransitionGroup>
      </div>
    );
  }
}

export default Import;
