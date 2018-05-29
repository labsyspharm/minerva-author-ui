import React from "react";
import Dropdown from "./dropdown";

const Banner = ({ session, handleLogin, handleLogout }) => {

  const loggedIn = !!session;
  const logButtonClassName = loggedIn ? "btn-outline-dark" : "btn-outline-success";
  const handleLog = loggedIn ? handleLogout : handleLogin;
  console.log(session);
  const logText = loggedIn ? session['attrs']['preferred_username'] : 'Login';

  return (
  <nav className="navbar navbar-expand-lg navbar-dark">
    <a className="navbar-brand" href="#">Minerva WebGL2 Viewer</a>
    <div id="navbarNavDropdown" className="navbar-collapse collapse">
      <ul className="navbar-nav mr-auto">
        <li className="nav-item active">
          <a className="nav-link" href="#">Repositories<span className="sr-only">(current)</span></a>
        </li>
       </ul>
       <ul className="navbar-nav">
        <li className="nav-item">
					<Dropdown>
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

export default Banner;
