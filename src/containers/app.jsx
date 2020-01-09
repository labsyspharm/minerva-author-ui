import React, { Component } from "react";

import Repo from "./repo";
import Import from "./import";

class App extends Component {

  constructor() {
    super();

    this.state = {
      loaded: false,
      channels: 0,
      width: 1024,
      height: 1024
    }

  }

  async componentDidMount() {
    try {
      setInterval(async () => {
        const {loaded} = this.state;
        if (loaded === false) {
          const res = await fetch('http://localhost:2020/api/import');
          const import_result = await res.json();

          this.setState({
            loaded: import_result.loaded,
            channels: import_result.channels,
            width: import_result.width,
            height: import_result.height,
          })
        }
      }, 3000);
    } catch(e) {
      console.log(e);
    }
  }

  render() {
    const {loaded, channels, width, height} = this.state;

    return (
      loaded? <Repo channels={channels} width={width} height={height}/> : <Import/>
    );
  }
}

export default App;
