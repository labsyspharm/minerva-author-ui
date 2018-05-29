import React, { Component } from "react";
import ModalText from "../components/modaltext";

class Modal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      values: {}
    };
  }

  render() {
    const {show, title, fields, onClose} = this.props;
		const {values} = this.state;

    if(!show) {
      return null;
    }

    return (
      <div className="modal">
        <div className="modal-dialog">
					<div className="modal-content">

						<div className="modal-header">
							<h4 className="modal-title">{title}</h4>
						</div>

						<div className="modal-body">
							<form onSubmit={(ev) => {
								ev.preventDefault();
								onClose(values);
							}}>
								{fields.map(field => {
									return (
										<ModalText field={field}
											value={values[field] || ''}
											onChange={ev => {
												let update = {};
												update[field] = ev.target.value; 
												this.setState({
													values: { ...values, ...update}
												});
											}}>
										</ModalText>
									);
								})}
								<input type="submit" value={"Submit"}
									className="btn btn-success">
								</input>
							</form>
						</div>

					</div>
        </div>
      </div>
    );
  }
}

export default Modal;
