import React, { Component } from "react";
import ImportList from "../components/importlist";
import Import from "../components/import";

// CSS
import '../style/repo';

class Repo extends Component {

  constructor() {
    super();
    this.state = {
      importMap: new Map([
         [1, {
          id: 1,
          name: 'Some Import',
          url: 'http://example.com',
          images: [1001, 1002]
         }],
         [2, {
          id: 2,
          name: 'Another Import',
          url: 'http://example.com',
          images: [2001]
         }]
      ]),
      imports: [1, 2],
      activeSource: 1
    };

  }

  render() {
    return (
      <div className="Repo">
        <ImportList>
          {this.state.imports.map(id => {
            const imported = this.state.importMap.get(id);
            return (
              <Import imported={imported}></Import>
            );
          })} 
        </ImportList>
      </div>
    );
  }
}

export default Repo;
