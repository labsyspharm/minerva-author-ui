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

    const buttonClass = "btn btn-lg btn-block " + ((action) => {
      if (action == "Close") {
        return 'btn-danger';
      } 
      return 'btn-success';
    })(action);

    return (
      <div className="modal">
        <div className="modal-dialog">
					<div className="modal-body">
						<form>

							<h1 className="h3 mb-3 font-weight-normal">{title}</h1>
							<p> {this.props.children} </p>
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

							<button type="submit" className={buttonClass}
								onClick={(ev) => {
									ev.preventDefault();
									onClose(values);
								}}>
							{action}	
							</button>
						</form>
					</div>
				</div>
			</div>
    );
  }
}

export default Modal;
