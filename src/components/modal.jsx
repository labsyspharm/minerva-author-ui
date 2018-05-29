import React from 'react';

class Modal extends React.Component {
  render() {
    const {show, title, children, onClose} = this.props;

    if(!show) {
      return null;
    }

    return (
      <div className="modal">
        <div className="modal-dialog">
          <form action="#" onsubmit={onClose}>
            <div className="modal-content">

              <div className="modal-header">
                <h4 className="modal-title">{title}</h4>
              </div>

              <div className="modal-body">

                {React.Children.map(children, (child, id) => {
                  return (
                    <div class="form-group" key={id}>
                    {child}
                    <input type="text"/>
                    </div>
                  );
                })}

              </div>

              <div className="modal-footer">
                <input type="submit"
                  className="btn btn-success">
                </input>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

export default Modal;
