import React, { Component } from "react";

import Repo from "./repo";
import Import from "./import";

import authenticate from '../login';

const getAjaxHeaders = function(){
  const user = 'john_hoffer@hms.harvard.edu';
  const pass = Promise.resolve('MEETING@lsp2');
  return authenticate(user, pass).then(function(token){
    return {
      'Content-Type': 'application/json',
      'Authorization': token,
      'Accept': 'application/json'
    };
  });  
};

class App extends Component {

  constructor() {
    super();

    this.state = {
      token: '',
      loaded: false,
      minerva: false,
      url: 'http://localhost:2020/api/u16',
      //minerva: true,
      //url: 'https://3v21j4dh1d.execute-api.us-east-1.amazonaws.com/dev/image/',
			uuid: '4b7274d1-44de-4bda-989d-9ed48d24c1ac',
      //uuid: '0c18ba28-872c-4d83-9904-ecb8b12b514d',
      channels: [],
      width: 1024,
      height: 1024
    }

  }

  async componentDidMount() {
    const {minerva, url, uuid} = this.state;

    if (minerva) {
      const fetch_dimensions = async () => {
          
        const ajaxHeaders = await getAjaxHeaders();
        const res = await fetch(url + uuid + '/dimensions', {
          headers: ajaxHeaders
        });
        const result = await res.json();
        const pixels = result.data.pixels;

        this.setState({
          loaded: true,
          token: ajaxHeaders.Authorization,
          channels: [...Array(pixels.SizeC).keys()].map(String),
          width: pixels.SizeX,
          height: pixels.SizeY,
        })
      }
      fetch_dimensions();
      return;
    }

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
    const {token, loaded, channels, width, height, minerva, url, uuid} = this.state;

    if (loaded) {
      return (<Repo token={token} minerva={minerva}
                    channels={channels} url={url} uuid={uuid}
                    width={width} height={height}/>
      )
    }
    return (
      <Import/>
    );
  }
}

export default App;
