import React, { Component } from "react";

/**
 * @param {Object} image
 */
const ImageName = ({image}) => {
  const {id, name, url} = image;

  return (
    <a href={url}>{name}</a>
  );
}

export default ImageName;
