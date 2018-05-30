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
          Options
        </button>
        <div className={"dropdown-menu " + menuDisplay}>
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default Dropdown;
