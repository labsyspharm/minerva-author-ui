import React from "react";
import "../style/modal.css";

export default class Modal extends React.Component {
  render() {
    if (!this.props.show) {
      return null;
    }
    const OK = this.props.confirmButton || 'OK';
    return (
			<div id="myModal" className="minerva modal">

				<div className="modal-content">
					{this.props.children}
					<button className="ui button" onClick={this.props.toggle}>{OK}</button>
				</div>

			</div>
    );
  }
}
