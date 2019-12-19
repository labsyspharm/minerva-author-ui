import React, { Component } from "react";

import Repo from "./repo";
import Import from "./import";

class App extends Component {

  constructor() {
    super();

    this.state = {
      loaded: false,
      channels: 0
    }

  }

  async componentDidMount() {
    try {
      setInterval(async () => {
        const {loaded} = this.state;
        if (loaded === false) {
          const res = await fetch('/api/import');
          const import_result = await res.json();

          this.setState({
            loaded: import_result.loaded,
            channels: import_result.channels,
          })
        }
      }, 3000);
    } catch(e) {
      console.log(e);
    }
  }

  render() {
    const {loaded, channels} = this.state;

    return (
      loaded? <Repo channels={channels}/> : <Import/>
    );
  }
}

export default App;
