import React, { Component } from "react";
import Sources from "../components/sources";

// CSS
import '../style/repo';

class Repo extends Component {

  constructor() {
    super();
    this.state = {
      sources: {
         1: {
          id: 1,
          type: 'aws',
          url: 'http://example.com',
          channels:[1001, 1002]
         },
         2: {
          id:2,
          type:'image',
          url:'http://example.com',
          channels:[2001]
         }
      },
      activeSource: 1
    };

  }

  render() {
    return (
      <div className="Repo">
        <Sources sources={[
          {id:1, type:'aws', url:'http://example.com', channels:[1001, 1002]},
          {id:2, type:'image', url:'http://example.com', channels:[2001]}
        ]}/>
      </div>
    );
  }
}

export default Repo;
