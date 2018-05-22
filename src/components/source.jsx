import React, { Component } from "react";

class Source extends Component {
  constructor() {
    super();
    this.state = {
			id: 1000,
      type: "aws",
      url: "https://minerva-test-images.s3.amazonaws.com/png_tiles",
      channels: [
        { id: 1000, min: 0, max: 1, color: "FF0000" },
        { id: 1001, min: 0.05, max: 0.1, color: "00FF00" }
      ]
    }
  }
  render() {
    const { channels } = this.state;
    return <ul>{channels.map(el => <li key={el.id}>{el.color}</li>)}</ul>;
  }
}

export default Source;
