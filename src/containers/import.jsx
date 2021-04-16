import React, { Component } from "react";
import ImportForm from '../components/importform';
import CloudImportForm from '../components/cloudimportform';
import '../style/import';

class Import extends Component {

  render() {
    return (
      <div className="full-height">
        <div className="center-div">
        <div>
          <img className="minerva-author-logo" src="image/Minerva-Author_HorizLogo_RGB.svg"></img>
        </div>
          { this.props.env === 'local' ?
            <ImportForm
              updateInputFile={this.props.updateInputFile}
              importCallback={this.props.importCallback}
            />
          : 
            <CloudImportForm onToken={this.props.onToken} 
              onMinervaImage={this.props.onMinervaImage} 
              onStoryLoaded={this.props.onStoryLoaded}
              onSignout={this.props.onSignout}
              username={this.props.username} /> }
        </div>
      </div>
    );
  }
}

export default Import;
