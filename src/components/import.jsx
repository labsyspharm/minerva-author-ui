import React, { Component } from "react";
import ImageList from "./imagelist"
import ImageName from "./imagename"

/** 
 * @param {Map} imageMap - From id to image
 * @param {Object} imported
 */
const Import = ({imageMap, imported}) => {
  const {id, name, images} = imported;
  return (
    <ul>
      <ul>
        <span> {name}: </span>
        <ImageList>
          {images.map(id => {
            const image = imageMap.get(id);
            return (
              <ImageName key={id} image={image}/>
            );
          })} 
        </ImageList>
      </ul>
    </ul>
  );
}

export default Import;
