import React, { Component } from "react";
import ImageList from "./imagelist"
import ImageName from "./imagename"

/**
 * @param {Map} imageMap - From id to img
 * @param {Object} imp
 */
const Import = ({imageMap, imp}) => {
  const {id, name} = imp;
  const entries = imageMap.entries();

  return (
    <ul>
      <ul>
        <span> {name}: </span>
        <ImageList>
          {Array.from(entries).map(entry => {
            const [id, img] = entry;
            return (
              <ImageName key={id} img={img}/>
            );
          })}
        </ImageList>
      </ul>
    </ul>
  );
}

export default Import;
