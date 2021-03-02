import React, { Component } from "react";

import Select from 'react-select';

import HuePicker from "../components/huepicker";
import ChannelControls from "./channelcontrols";
import FileBrowserModal from "../components/filebrowsermodal";
import Overlays from "./overlays";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import {faLocationArrow} from "@fortawesome/free-solid-svg-icons";
import {faCrosshairs} from "@fortawesome/free-solid-svg-icons";
import {faPlus} from "@fortawesome/free-solid-svg-icons";

import '../style/controls'

class Controls extends Component {

  constructor(props) {
    super();
  }

  render() {

    const {addArrowText, rgba, minerva} = this.props;
    const {deleteOverlay, deleteArrow} = this.props;
    const {activeStory, handleSelectStory, handleSelectStoryMasks} = this.props;
    const {handleClusterChange, handleClusterInsert, handleClusterRemove} = this.props;
    const {showVisDataBrowser, openVisDataBrowser, onVisDataSelected} = this.props;
    const {visLabels, activeVisLabel, handleSelectVis} = this.props;
    const {stories, storyName, storyMasks, storyText, textEdit} = this.props;
    const {handleStoryInsert, handleStoryName, handleStoryText} = this.props;
    const {handleStoryRemove, handleStoryChange, overlays, arrows} = this.props;
    const {arrowClick, lassoClick, boxClick, drawType} = this.props;
    const {masks, activeMaskId, handleUpdateMask, maskPathStatus} = this.props;
    const {handleMaskChange, handleMaskInsert, handleMaskRemove} = this.props;
    const {showMaskBrowser, openMaskBrowser, onMaskSelected} = this.props;
    const {showMaskMapBrowser, openMaskMapBrowser, onMaskMapSelected} = this.props;

    const activeMasks = new Map([...masks].map(([k,v])=>{
                                  return [k, {
                                    ...v,
                                    value: k, id: k,
                                    label: '#' + (k+1) + (v.name? ': ' + v.name : '')
                                  }]
                                }))
    const activeStoryMasks = new Map(storyMasks.map(a => [a, activeMasks.get(a)]))

    let activeMask = activeMasks.get(activeMaskId)
    if (activeMask === undefined) {
      activeMask = {
        color: [255, 255, 255],
        id: 0, value: 0,
        map: new Map(),
        map_path: "",
        label: "",
        name: "",
        path: ""
      };
    }
    const ready_mask_paths = [...masks].filter(([k,v]) => {
      const p_status = maskPathStatus.get(v.path)
      return p_status? p_status.ready : false
    })
    const is_active_mask_loading = ((p_status) => {
      return p_status && !p_status.invalid && !p_status.ready
    })(maskPathStatus.get(activeMask.path))

    const activeClusters = new Map([...activeVisLabel.clusters].map(([k,v])=>{
                                  return [k, {
                                    name: v.name,
                                    color: v.color,
                                    value: k, id: k,
                                  label: '#' + (k+1) + (v.name? ': ' + v.name : '')
                                  }]
                                }))

    let activeCluster = activeClusters.get(activeVisLabel.cluster)
    if (activeCluster === undefined) {
      activeCluster = {
        color: [255, 255, 255],
        id: 0,
        label: "",
        name: "",
        value: 0
      };
    }

    const storyLabels = new Map([...stories].map(([k,v])=>{
                                  return [k, {
                                    value: k, id: k,
                                    label: '#' + (k+1) + (v.name? ': ' + v.name : '')
                                  }]
                                }))

    let activeStoryLabel = storyLabels.get(activeStory)
    if (activeStoryLabel === undefined) {
      activeStoryLabel = {value: activeStory, id: activeStory,
                          label: '#' + (activeStory+1)}
    }
    const mask_help_text = is_active_mask_loading ? 'Loading...' : (
      ready_mask_paths.length ? (
        'Open the "Edit Story" tab to select loaded masks to show.'
      ) : ''
    )

    let plusButton = false ? (
      <button className="ui button compact" onClick={handleMaskInsert} title="Add mask">
        <FontAwesomeIcon icon={faPlus} />
      </button>
    ) : '';
    let maskData = minerva ? '' : (
      <div className="ui form">
          <div className="row">
            <div className="col-12">
              <div className="font-white">
                Mask .tif or ome.tif:
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <input value={activeMask.path} onChange={(v)=>{
                onMaskSelected({path: v.target.value})
              }} style={{ width: "72%" }} id="maskpath" name="maskpath" type="text"/>
              <button type="button" onClick={openMaskBrowser} className="ui button">Browse</button>
              <FileBrowserModal open={showMaskBrowser} close={onMaskSelected}
                title="Select a TIFF or OME-TIFF mask image" 
                onFileSelected={onMaskSelected} 
                filter={["tif", "tiff"]}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <div className="font-white">
                Mask (CellID, State) .csv:
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <input value={activeMask.map_path} onChange={(v)=>{
                onMaskMapSelected({path: v.target.value})
              }} style={{ width: "72%" }} id="mask_map_path" name="mask_map_path" type="text"/>
              <button type="button" onClick={openMaskMapBrowser} className="ui button">Browse</button>
              <FileBrowserModal open={showMaskMapBrowser} close={onMaskMapSelected}
                title="Select a CSV mask cell state file" 
                onFileSelected={onMaskMapSelected} 
                filter={["csv"]}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-7">
              <div className="font-white">
                Masks:
              </div>
              <div className="width-100">
                <Select
                  value={activeMask}
                  onChange={(m)=>handleMaskChange(m.value)}
                  options={Array.from(activeMasks.values())}
                />
              </div>
            </div>
            <div className="pt-2 pl-0 col-5">
              <button className="ui button compact" title="Previous waypoint" onClick={()=>{
                handleMaskChange(Math.max(0, activeMaskId - 1))
              }}>
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              {plusButton}
              <button className="ui button compact" title="Next waypoint" onClick={()=>{
                handleMaskChange(Math.min(activeMaskId + 1, activeMasks.size - 1))
              }}>
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
              <button className="ui button red compact" title="Delete waypoint" onClick={handleMaskRemove}>
                X
              </button>
            </div>
          </div>
          <div className="row font-white">
            <div className="col-4">
              Mask Color:
              <HuePicker
                  color={ activeMask.color}
                handleChange={(color)=>handleUpdateMask({ name: activeMask.name, path: activeMask.path, color: color })}
              />
            </div>
            <div className="col-4" style={{textAlign: "right", paddingRight: 0}}>
                Mask Name:
            </div>
            <div className="col-4">
                <input value={activeMask.name} onChange={(v)=>handleUpdateMask({ name: v.target.value, path: activeMask.path, color: activeMask.color })} style={{ width: "100%" }} id="maskname" name="maskname" type="text"/>
            </div>
         </div>
        <div className="row font-white">
          <div className="col-12">
            {mask_help_text}
          </div>
        </div>
      </div>
    );

    let visData = ''
    if (activeVisLabel.id >= 0) {
      let visDataGeneric = (
      <div>
        <input value={activeVisLabel.data} onChange={(v)=>handleSelectVis(activeVisLabel, v.target.value)} style={{ width: "72%" }} id="visdatapath" name="visdatapath" type="text"/>
        <button type="button" onClick={openVisDataBrowser} className="ui button">Browse</button>
        <FileBrowserModal open={showVisDataBrowser} close={onVisDataSelected}
          title="Select a csv file" 
          onFileSelected={onVisDataSelected} 
          filter={["csv"]}
        />
      </div>
      )
      if ([0, 1].includes(activeVisLabel.id)) {
        let clusterData = ''
        if (activeCluster) {
          clusterData = (
          <div className="row font-white">
            <div className="col-4">
              Cluster Color:
              <HuePicker
                  color={ activeCluster.color}
                handleChange={ (color) =>handleSelectVis(activeVisLabel, null, null, null, null, new Map([[activeCluster.id, { name: activeCluster.name, color: color}]]))}
              />
            </div>
            <div className="col-8">
                Cluster Name:
                <input value={activeCluster.name} onChange={(v)=>handleSelectVis(activeVisLabel, null, null, null, null, new Map([[activeCluster.id, { name: v.target.value, color: activeCluster.color }]]))} style={{ width: "50%" }} id="clustername" name="clustername" type="text"/>
              </div>
          </div>
          )
        }
        visData = (
        <div>
          <div>
            {visDataGeneric}
            <div className="font-white">
              X Axis:
              <input value={activeVisLabel.x} onChange={(v)=>handleSelectVis(activeVisLabel, null, v.target.value)} style={{ width: "25%", marginRight: "2em"}} id="visxaxis" name="visxaxis" type="text"/>
              Y Axis:
              <input value={activeVisLabel.y} onChange={(v)=>handleSelectVis(activeVisLabel, null, null, v.target.value)} style={{ width: "25%" }} id="visyaxis" name="visyaxis" type="text"/>
            </div>
          </div>
          <div className="row">
            <div className="col-5">
              <div className="font-white">
                Clusters:
              </div>
              <div className="width-100">
                <Select
                  value={activeCluster}
                  onChange={(c)=>handleClusterChange(c.value)}
                  options={Array.from(activeClusters.values())}
                />
              </div>
            </div>
            <div className="pt-2 pl-0 col-7">
              <button className="ui button compact" title="Previous waypoint" onClick={()=>{
                handleClusterChange(Math.max(0, activeVisLabel.cluster - 1))
              }}>
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <button className="ui button compact" onClick={handleClusterInsert} title="Add waypoint">
                <FontAwesomeIcon icon={faPlus} />
              </button>
              <button className="ui button compact" title="Next waypoint" onClick={()=>{
                handleClusterChange(activeVisLabel.cluster + 1)
              }}>
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
              <button className="ui button red compact" title="Delete waypoint" onClick={handleClusterRemove}>
                X
              </button>
            </div>
          </div>
          {clusterData}
        </div>
        ) 
      }
      else if (activeVisLabel.id == 2) {
        const colormapInvertOptions = [
          {
            value: false, id: 0,
            label: 'False'
          },
          {
            value: true, id: 1,
            label: 'True'
          }
        ];
        const colormapInvert = colormapInvertOptions[activeVisLabel.colormapInvert? 1 : 0];

        visData = (
        <div>
          {visDataGeneric}
          <div className="font-white">
            Invert colormap:
          </div>
          <div className="width-100">
            <Select
              value={colormapInvert}
              onChange={(c)=>handleSelectVis(activeVisLabel, null, null, null, c.value)}
              options={colormapInvertOptions}
            />
          </div>
        </div>
        )
      }
      else {
        visData = (
        <div>
          {visDataGeneric}
        </div>
        ) 
      }
    }
    let storyMaskControls = ''
    let visControls = ''
    if (!minerva) {
      storyMaskControls = rgba? '' : (
        <div>
          <div className="font-white">
            Masks:
          </div>
          <div className="width-100">
            <Select
              isMulti={true}
              onChange={handleSelectStoryMasks}
              value={Array.from(activeStoryMasks.values())}
              options={Array.from(activeMasks.values())}
            />
          </div>
        </div>
      );
      visControls = (
        <div>
          <div className="font-white">
            Visualization:
          </div>
          <div className="width-100">
            <Select
              onChange={(v)=>handleSelectVis(v)}
              value={activeVisLabel}
              options={Array.from(visLabels.values())}
            />
            {visData}
          </div>
        </div>
      )
    }
    if (textEdit || rgba) {
      return (
			<div className="ui form">
				<div className="row">
					<div className="col no-right-padding">
						<div className="">
              <div className="row">
                <div className="col-5">
                  <div className="font-white">
                    Waypoints:
                  </div>
                  <div className="width-100">
                    <Select
                      onChange={handleSelectStory}
                      value={activeStoryLabel}
                      options={Array.from(storyLabels.values())}
                    />
                  </div>
                </div>
                <div className="pt-2 pl-0 col-7">
                  <button className="ui button compact" title="Previous waypoint" onClick={()=>{
                    handleStoryChange(Math.max(0, activeStory - 1))
                  }}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                  </button>
                  <button className="ui button compact" onClick={handleStoryInsert} title="Add waypoint">
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                  <button className="ui button compact" title="Next waypoint" onClick={()=>{
                    handleStoryChange(activeStory + 1)
                  }}>
                    <FontAwesomeIcon icon={faArrowRight} />
                  </button>
                  <button className="ui button red compact" title="Delete waypoint" onClick={handleStoryRemove}>
                    X
                  </button>
                </div>
              </div>
						</div>
						<input className="width-100" type="text" placeholder="Waypoint Name" value={storyName} onChange={handleStoryName}></input>
            <textarea className="width-100 height-20vh" placeholder="Waypoint Description" value={storyText} onChange={handleStoryText}></textarea>
            {storyMaskControls}
            {visControls}
					</div>
					<div className="col-1 p-0">
						<div className="btn-group-vertical">
							<span id="arrow-switch" className="nav-item arrow-switch">
							<a className="btn" onClick={arrowClick} title="Add arrow">
									<FontAwesomeIcon icon={faLocationArrow}
										color={(drawType == 'arrow')? 'blue': 'white'}
									/>
							</a>
							</span>
							<span id="draw-switch" className="nav-item draw-switch">
							<a className="btn" onClick={boxClick} title="Add rectangle">
									<FontAwesomeIcon icon={faCrosshairs}
										color={(drawType == 'box')? 'blue': 'white'}
									/>
							</a>
							</span>
						</div>
					</div>
				</div>
				<Overlays deleteOverlay={deleteOverlay}
				deleteArrow={deleteArrow} addArrowText={addArrowText}
				overlays={overlays} arrows={arrows}></Overlays>
			</div>
      )
    }

    const {handleSelect, handleChange} = this.props;
    const {activeChanLabel, chanLabel} = this.props;
    const {activeChannels} = this.props;

    return (
      <div className="row">
        <div className="col">
        <Select
          isMulti={true}
          onChange={handleSelect}
          value={Array.from(activeChanLabel.values())}
          options={Array.from(chanLabel.values())}
        />
        <div>
          <ChannelControls className="ChannelControls"
            channels={ activeChannels }
            handleChange={ handleChange }
          />
        </div>
        {maskData}
        </div>
      </div>
    );
  }
}

export default Controls;
