import React, { Component } from "react";

import Repo from "./repo";
import Import from "./import";

class App extends Component {

  constructor() {
    super();

    this.state = {
      image: null
    }

  }

  async componentDidMount() {
    const {image} = this.state;

    try {
      setInterval(async () => {
        if (image === null) {
          const res = await fetch('/api/import');
          const import_result = await res.json();

          this.setState({
            image: import_result.image,
          })
        }
      }, 3000);
    } catch(e) {
      console.log(e);
    }
  }

  render() {
    const {image} = this.state;

    return (
      image === null? <Import/> : <Repo/>
    );
  }
}

export default App;
