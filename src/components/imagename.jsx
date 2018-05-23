import React, { Component } from "react";

/** 
 * @param {number} id - which channel.
 */
const ImageName = ({id}) => {

  return (
    <li key={id}>
      #{id}
    </li>
  );
}

export default ImageName;
