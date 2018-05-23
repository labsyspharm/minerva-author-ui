import React, { Component } from "react";
import ImportList from "../components/importlist";
import Import from "../components/import";

class Repo extends Component {

  constructor() {
    super();
    this.state = {
      importMap: new Map([
         [1, {
          id: 1,
          name: 'Some Import',
          images: [1, 2]
         }],
         [2, {
          id: 2,
          name: 'Another Import',
          images: [1]
         }]
      ]),
      imageMaps: {
        1: new Map([
          [1, {
            id: 1,
            name: 'Some Image',
            url: 'http://example.com'
          }],
          [2, {
            id: 2,
            name: 'Second Image',
            url: 'http://example.com'
          }]
        ]),
        2: new Map([
          [1, {
            id: 1,
            name: 'Another Image',
            url: 'http://example.com'
          }]
        ]),
      },
      imports: [1, 2]
    };
  }

  render() {
    return (
      <div className="Repo">
        <ImportList>
          {this.state.imports.map(id => {
            const imported = this.state.importMap.get(id);
            const imageMap = this.state.imageMaps[id];
            return (
              <Import key={id} imageMap={imageMap} imported={imported}/>
            );
          })} 
        </ImportList>
      </div>
    );
  }
}

export default Repo;
