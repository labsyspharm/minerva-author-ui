import React, { Component } from "react";
import ImageList from "./imagelist"
import ImageName from "./imagename"

/**
 * @param {Map} imgs - From uuid to img
 * @param {Object} imp
 * @param {function} click
 */
const Import = ({imgs, imp, click}) => {

  return (
    <ul>
      <ul>
        <span> {imp.name}: </span>
        <ImageList>
          {imp.imgs.map(uuid => {
            const img = imgs.get(uuid);
            return (
              <ImageName key={uuid}
              click={click}
              img={img}/>
            );
          })}
        </ImageList>
      </ul>
    </ul>
  );
}

export default Import;
