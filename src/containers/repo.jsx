import React, { Component } from "react";

import ImageView from "./imageview";
import ChannelControls from "./channelcontrols";
import ImportList from "../components/importlist";
import Import from "../components/import";

class Repo extends Component {

  constructor() {
    super();
    this.state = {
			imps: new Map([
				['uuid1', { uuid: 'uuid1', name: 'import1', imgs: ['uuid3', 'uuid4'] }],
				['uuid2', { uuid: 'uuid2', name: 'import2', imgs: ['uuid5'] }]
			]),
			imgs: new Map([
				['uuid3', {
					uuid: 'uuid3', name: 'image1',
					url: 'https://minerva-test-images.s3.amazonaws.com/png_tiles'
				}],
				['uuid4', {
					uuid: 'uuid4', name: 'image2',
					url: 'https://minerva-test-images.s3.amazonaws.com/png_tiles'
				}],
				['uuid5', {
					uuid: 'uuid5', name: 'image3',
					url: 'https://minerva-test-images.s3.amazonaws.com/png_tiles'
				}]
			]),
			'active': {
				uuid: 'uuid4',
				channels: new Map([
					[0, { id: 0, color: [255, 0, 0], range: [0, 0.5]}],
					[1, { id: 1, color: [0, 0, 255], range: [0, 0.1]}]
				])
			}
    };
  }

	/**
	 * This function is for testing without a real backend
	 */
	dummyAjax(img) {

		var channels = new Map();

		// Get a random integer, color, range
		const randInt = n => Math.floor(Math.random() * n);
		const randColor = () => {
			return [
			[0,0,255],[0,127,255],[0,255,0],[0,255,127],[0,255,255],
			[127,0,255],[127,127,127],[127,127,255],[127,255,0],[127,255,127],
			[255,0,0],[255,0,127],[255,0,255],[255,127,0],[255,127,127],[255,255,0]
			][randInt(16)]
		}
		const randRange = () => {
			return [
 			[0, .3], [0, .5], [0, .7], [0, 1], 
 			[.3, .5], [.3, .7], [.3, 1], 
 			[.5, .7], [.5, 1], [.7, 1]
			][randInt(10)]
		}

		for (let id of Array(randInt(4)+1).keys()) {
  		channels.set(id, {
				id: id,
				range: randRange(),
				color: randColor(),
			});
		}

		this.setState({
			'active': {
				uuid: img.uuid,
				channels: channels
			}
		});
	}

  updateColor(id, colorRGB) {

    const {channels} = this.state.active;
    var channelsCopy = new Map(channels);

    channelsCopy.get(id).color = colorRGB;

    this.setState({
      channels: channelsCopy
    })
  }

  updateRange(id, rangeInt) {

    const {channels} = this.state.active;
    var channelsCopy = new Map(channels);

    const range = rangeInt.map(v => {
      return v / 100;
    });
    if (!(0 <= range[0] < range[1] <= 1)) {
      return;
    }

    channelsCopy.get(id).range = range;

    this.setState({
      channels: channelsCopy
    })
  }

  render() {
    const {imps, imgs, active} = this.state;

		const entries = imps.entries();
    const img = imgs.get(active.uuid);
		const {channels} = active;

    return (
      <div className="Repo">
        <ImportList>
          {Array.from(entries).map(entry => {
            const [uuid, imp] = entry;
            return (
              <Import key={uuid}
							click={this.dummyAjax.bind(this)}
							imgs={imgs} imp={imp}/>
            );
          })}
        </ImportList>
        <ChannelControls
          channels={channels}
          updateColor={this.updateColor.bind(this)}
          updateRange={this.updateRange.bind(this)}
        />
        <ImageView
          img={img}
          channels={channels}
        />
      </div>
    );
  }
}

export default Repo;
