import React, { Component } from "react";
import ImageList from "./imagelist"
import ImageName from "./imagename"

/** 
 * @param {Object} imported - {url, name, id, images}.
 */
const Import = ({imported}) => {
  const {url, name, id, images} = imported;
  return (
    <ul>
      <a href={url}> Import #{id}</a>
      <span> has: </span>
      <ul>
        <li key="0">
        <span> name: </span>
        <span> {name} </span>
        </li>
        <li key="1">
        <span> images: </span>
        <ImageList>
          {images.map(image => {
            return (
              <ImageName id={image}></ImageName>
            );
          })} 
        </ImageList>
        </li>
      </ul>
    </ul>
  );
}

export default Import;
