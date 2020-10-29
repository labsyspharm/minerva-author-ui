import React from "react";
import '../style/loader.css';

export default class Loader extends React.Component {
    render() {
        if (!this.props.active) {
            return null;
        }
        let clazz = "minerva-spinner-image";
        if (this.props.size === "small") {
            clazz += ' small';
        }
        return (
           <div id="minerva-spinner" className="ui inline text small">
               <img className={clazz} src="images/Minerva_FinalLogo_NoText_RGB.svg" />
               {this.props.text}
            </div>
        );
    }
}