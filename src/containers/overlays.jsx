import React, { Component } from "react";

import OverlayList from "../components/overlaylist";

class Overlays extends Component {

  render() {
    const { overlays, arrows } = this.props;
    const { deleteOverlay, deleteArrow } = this.props;
    const { addArrowText, addOverlayText } = this.props;

    const arrowDivs = arrows.map((o, i) => {
      return (
      <div className="ui buttons" key={i}>
        <button className="ui button red compact overlay-x" title="Delete" onClick={()=>{
						deleteArrow(i);
					}}>
          X
        </button>
        <button className="ui button compact overlay-arrow" title="Edit description" onClick={()=>{
            addArrowText(i);
        }}>
        Arrow {i}
        </button>
      </div>
      );
    });
    const overlayDivs = overlays.map((o, i) => {
      return (
      <div className="ui buttons" key={i}>
        <button className="ui button red compact overlay-x" title="Delete" onClick={()=>{
						deleteOverlay(i);
					}}>
          X
        </button>
        <button className="ui button compact" title="Generate text" onClick={()=>{
            addOverlayText(i);
        }}>
        Overlay {i}
        </button>
      </div>
      );
    });

    return (
      <OverlayList>
        { arrowDivs }
        { overlayDivs }
      </OverlayList>
    );
  }
}

export default Overlays;
