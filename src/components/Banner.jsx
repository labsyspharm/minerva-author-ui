import React, {Component} from "react";
import Dropdown from "./dropdown";

class Banner extends Component {

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
		const { session, handleLogin, handleLogout, addImages } = this.props;
		const {show} = this.state;
    const navDisplay = show? "" : "collapse";

		const loggedIn = !!session;
		const logButtonClassName = loggedIn ? "btn-outline-dark" : "btn-outline-success";
		const handleLog = loggedIn ? handleLogout : handleLogin;
		const logText = loggedIn ? session['attrs']['preferred_username'] : 'Login';

		return (
		<nav className="navbar navbar-expand-lg navbar-dark">
			<a className="navbar-brand" href="#">Minerva WebGL2 Viewer</a>
			<button className="navbar-toggler" type="button"
        onClick={this.toggleDropdown}>
				<span className="navbar-toggler-icon"></span>
			</button>
			<div className={"navbar-collapse "+navDisplay}>
				<ul className="navbar-nav mr-auto">
					<li className="nav-item active">
						<a className="nav-link" href="#">
							Repositories
							<span className="sr-only">(current)</span>
						</a>
					</li>
				 </ul>
				 <ul className="navbar-nav">
					<li className="nav-item">
						<Dropdown>
							<a className="dropdown-item"
								onClick={addImages}>
								Add Images
							</a>
						</Dropdown>
					</li>
					<button className={ logButtonClassName + " btn my-2 my-sm-0" }
						onClick={ handleLog }>
						{ logText }
					</button>
				</ul>
			</div>
		</nav>
		);
	}
}

export default Banner;
