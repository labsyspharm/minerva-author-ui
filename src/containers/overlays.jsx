import React, { Component } from "react";

import OverlayList from "../components/overlaylist";

class Overlays extends Component {

  render() {
    const { overlays, arrows } = this.props;
    const { deleteOverlay, deleteArrow } = this.props;

    const arrowDivs = arrows.map((o, i) => {
      return (
      <div>
        <button className="overlay-x" onClick={()=>{
						deleteArrow(i);
					}}>
          X
        </button>
        <span>Arrow {i}</span>
      </div>
      );
    });
    const overlayDivs = overlays.map((o, i) => {
      return (
      <div>
        <button className="overlay-x" onClick={()=>{
						deleteOverlay(i);
					}}>
          X
        </button>
        <span>Overlay {i}</span>
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
