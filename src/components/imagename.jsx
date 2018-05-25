import React, { Component } from "react";

/**
 * @param {Object} img
 * @param {function} click
 */
const ImageName = ({img, click}) => {
  const {name, url} = img;

  return (
    <a onClick={(e) => click(img)}>{name}</a>
  );
}

export default ImageName;
