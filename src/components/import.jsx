import React, { Component } from "react";
import ImageList from "./imagelist"
import ImageName from "./imagename"

/**
 * @param {Map} imgs - From uuid to img
 * @param {Object} imp
 */
const Import = ({imgs, imp}) => {

  return (
    <ul>
      <ul>
        <span> {imp.name}: </span>
        <ImageList>
          {imp.imgs.map(uuid => {
            const img = imgs.get(uuid);
            return (
              <ImageName key={uuid} img={img}/>
            );
          })}
        </ImageList>
      </ul>
    </ul>
  );
}

export default Import;
