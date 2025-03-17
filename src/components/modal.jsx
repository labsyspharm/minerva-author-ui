import React from "react";
import "../style/modal.css";

export default class Modal extends React.Component {
  render() {
    if (!this.props.show) {
      return null;
    }
    const OK = this.props.confirmButton || 'OK';
    const modalClassName = [
      "minerva", "modal", "full"
    ].filter(
      (k) => k !== "full" || this.props.full
    ).join(" ");
    return (
			<div className={modalClassName}>
				<div className="modal-content">
					{this.props.children}
					<button className="ui button primary" onClick={this.props.toggle}>{OK}</button>
				</div>

			</div>
    );
  }
}
