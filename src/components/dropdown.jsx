import React, {Component} from "react";

class Dropdown extends Component {
  constructor(props) {
    super(props);

    this.toggleDropdown = this.toggleDropdown.bind(this);

    this.state = {
      show: false
    };
  }

  toggleDropdown() {
    this.setState({
      show: !this.state.show
    });
  }
  
  render() {
    const {show} = this.state;
    const menuDisplay = show? "d-block" : "";
    return (
      <div className="dropdown show">
        <button 
          aria-haspopup="true" 
          className="btn btn-secondary dropdown-toggle" 
          onClick={this.toggleDropdown}>
          Dropdown button
        </button>
        <div className={"dropdown-menu " + menuDisplay}>
          <a className="dropdown-item" href="#nogo">Action</a>
          <a className="dropdown-item" href="#nogo">Another action</a>
          <a className="dropdown-item" href="#nogo">Something else here</a>
        </div>
      </div>
    );
  }
}

export default Dropdown;
