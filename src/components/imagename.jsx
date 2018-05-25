import React, { Component } from "react";

/**
 * @param {Object} img
 */
const ImageName = ({img}) => {
  const {name, url} = img;

  return (
    <a href={url}>{name}</a>
  );
}

export default ImageName;
