import React, { Component } from "react";
import ImageList from "./imagelist"
import ImageName from "./imagename"

/**
 * @param {Map} imageMap - From id to image
 * @param {Object} imported
 */
const Import = ({imageMap, imported}) => {
  const {id, name} = imported;
  const entries = imageMap.entries();

  return (
    <ul>
      <ul>
        <span> {name}: </span>
        <ImageList>
          {Array.from(entries).map(entry => {
            const [id, image] = entry;
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
