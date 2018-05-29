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
    const {action} = this.props;
		const {values} = this.state;

    if(!show) {
      return null;
    }

    const buttonClass = ((action) => {
      if (action == "Close") {
        return 'btn-danger';
      } 
      return 'btn-success';
    })(action);

    return (
      <div className="modal">
        <div className="modal-dialog">
					<div className="modal-content">

						<div className="modal-header">
							<h4 className="modal-title">{title}</h4>
						</div>

						<div className="modal-body">
              {this.props.children}
							<form onSubmit={(ev) => {
								ev.preventDefault();
								onClose(values);
							}}>
								{fields.map((field, key) => {
									return (
										<ModalText key={key} field={field}
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
								<input type="submit" value={action}
									className={"btn " + buttonClass}>
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
