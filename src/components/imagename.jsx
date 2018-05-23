import React, { Component } from "react";

/** 
 * @param {number} image
 */
const ImageName = ({image}) => {
  const {id, name, url} = image;

  return (
    <li key={id}>
      <a href={url}>{name}</a>
    </li>
  );
}

export default ImageName;
