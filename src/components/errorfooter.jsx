import React from 'react'
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default class ErrorFooter extends React.Component {

    render() {
        if (!this.props.message) {
          return null;
        }
        return (
          <div className="import-errors">
            <div className="ui icon message">
              <FontAwesomeIcon className="icon" icon={faExclamationCircle} />
              <div className="content">
                <div className="header">{this.props.message}</div>
              </div>
            </div>
          </div>
        );
      }
}
