import React, { Component } from "react";

/**
 * @param {function} click
 */
const Tick = ({className, children, onClick}) => {

  const onKeyPress = e => {
    if (e.key !== ' ') {
      return;
    }
    onClick();
  };

  return (
    <span className={className} tabIndex="0"
      onClick={onClick} onKeyPress={onKeyPress}>
      {children}
    </span>
  );
}

export default Tick;
