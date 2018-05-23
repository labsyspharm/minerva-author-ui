import Slider from "bootstrap-slider";

/** 
 * @param {number} id - id of channel
 */
const getSliderIds = id => {
  return {
    sliderId: "channel-"+ id + "-slider",
    minId: "channel-"+ id + "-min",
    maxId: "channel-"+ id + "-max"
  }
}

/** 
 * @param {number} id - id of channel
 */
const makeSlider = id => {
  const {sliderId} = getSliderIds(id);

  var slider = new Slider("#"+sliderId);

  slider.on("slide", function(sliderValue) {
    document.getElementById(minId).textContent = sliderValue;
  });
  document.getElementById(sliderId).style.display = '';

  return sliderId;
}

module.exports = {
  getSliderIds: getSliderIds,
  makeSlider: makeSlider
}
