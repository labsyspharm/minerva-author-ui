import React from "react";

export default class Loader extends React.Component {
    render() {
        let clazz = "ui inline text loader small";
        if (this.props.active) {
            clazz += " active";
        }
        return (
           <div className={clazz}>{this.props.text}</div>
        );
    }
}