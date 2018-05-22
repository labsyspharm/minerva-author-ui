import React, { Component } from "react";
import Sources from "./components/sources";

const title = "Sources";

class App extends Component {

  render() {
    return (
      <div className="App">
				<h2>{title}</h2>
        <Sources sources={[
          {id:1, type:'aws', url:'http://example.com', channels:[1001, 1002]},
          {id:2, type:'image', url:'http://example.com', channels:[2001]}
        ]}/>
      </div>
    );
  }
}

export default App;
