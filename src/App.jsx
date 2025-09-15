import { useState , useEffect , useRef} from 'react'
import React from 'react'
import Slider from './components/slider';
import './main.css';
import './presetData.js'
import './stats.js'
import './gui.js'
import './censusTractConversion.js'
import './mapping.js'
import './flowField.js'
import './main.js'
import './shaders.js'
import p5 from 'p5'
import { createPremadePresets } from './stats.js';
import { FlowField } from "./flowField";
import { viewPresets } from "./main";
import Dropdown from './components/dropdown.jsx';
import Checkbox from './components/checkbox.jsx';
import ColorPicker from './components/colorpicker.jsx';


function App() {
  const containerRef = useRef();
  const flowField = useRef();
  const [UISettings,setUISettings] = useState({
    devMode : false,
    dataTextureDimension : 200,
    backgroundColor : [255,255,255],
    particleCount : 40000,
    trailDecayValue : 0.1,
    particleSize : 0.1,
    particleAgeLimit : 1,
    framesBeforeLoop : 100,
    particleVelocity : 0.01,
    flowInfluence : 1.0,
    randomMagnitude : 0.0,
    repulsionStrength : 0.8,
    attractionStrength : 0.5,
    canvasSize : 600,
    // canvasSize : 100,
    useParticleMask : true, //for preventing particles from entering oceans
    isActive : true,
    renderFlowFieldDataTexture : false,
    renderCensusTracts: true,
    renderNodes : true,
    renderParticles:true,
    renderBigFlowField:false,
    repulsionColor : [20,0,180],
    attractionColor : [255,0,120],
    mouseInteraction : false,
    colorWeight: 0.5,
  });

  const dragStart = useRef({x:0,y:0});
  const UISettingsRef = useRef(UISettings);
  useEffect(() => {
    UISettingsRef.current = UISettings;
  },[UISettings]);

  p5.disableFriendlyErrors;
  useEffect(() => {
    const sketch = new p5(mainSketch,containerRef.current);
    return () => sketch.remove();
  },[]);

  //params that don't need to update the ui
  const simulationParams = useRef({
    mainCanvas : null,
    gl : null,
    offset : {
      x: 0,
      y: 0
    },
    dragOffset : {
      x:0,
      y:0
    },
    geoOffset : {
      x: 0,
      y: 0
    },
    scale : {
      x: 1,
      y: 1
    },
    presets : createPremadePresets(),
    presetFlowMask : null,
    tractOutlines : null,
    holcTexture : null,
    p5Ref : null,
    currentPreset : 0,
    viewPresets : viewPresets,
    currentViewPreset : 0
  });

  const [currentDataPreset,setCurrentDataPreset] = useState({title:simulationParams.current.presets[simulationParams.current.currentPreset].title,chartEquation:simulationParams.current.presets[simulationParams.current.currentPreset].chartEquation});
  const [currentViewPresetTitle,setCurrentViewPresetTitle] = useState(simulationParams.current.viewPresets[simulationParams.current.currentViewPreset].name);

  //P5 sketch body
  const mainSketch = (p) =>{

    p.setup = async () => {
      simulationParams.current.p5Ref = p;
      //create canvas and grab webGL context
      simulationParams.current.mainCanvas = p.createCanvas(UISettingsRef.current.canvasSize,UISettingsRef.current.canvasSize,p.WEBGL);
      simulationParams.current.gl = simulationParams.current.mainCanvas.GL;
      // p.pixelDensity(1);
      if(UISettingsRef.current.devMode){
        console.log("creating presets...");
        createPresets();
        //parsing data and attaching it to tract geometry
        setupMapData();
        //setting the offsets so that the first point in the first shape is centered
        let samplePoint = bayTracts[0].geometry.coordinates[0][0][0];
        simulationParams.current.geoOffset = {x:-samplePoint[0],y:-samplePoint[1]};
      }
      else{
        simulationParams.current.presetFlowMask = await p.loadImage("data/prerendered/flowFieldMask.png");
        simulationParams.current.tractOutlines = await p.loadImage("data/prerendered/censusTractOutlines.png");
        simulationParams.current.holcTexture = await p.loadImage("data/prerendered/HOLCTractOutlines.png");

      }
      //the manual offset
      simulationParams.current.offset = {x:simulationParams.current.mainCanvas.width/4,y:simulationParams.current.mainCanvas.height/4};
      let s = simulationParams.current.mainCanvas.width*2/5;
      simulationParams.current.scale = {x:s,y:s*(-1)};//manually adjusting the scale to taste
      flowField.current = new FlowField(UISettingsRef.current,simulationParams.current);
    }
    p.draw = () => {
      if(UISettingsRef.current.isActive)
        flowField.current.run(UISettingsRef.current,simulationParams.current);
    }
    // p.mouseClicked = () => {
    //   simulationParams.current.dragOffset = {x:p.mouseX-simulationParams.current.offset.x,y:p.mouseY-simulationParams.current.offset.y};
    //   dragStart.current = {x:simulationParams.current.offset.x,y:simulationParams.current.offset.y};
    // }
    // p.mouseDragged = () => {
    //   simulationParams.current.offset = {
    //     x: dragStart.current.x + p.mouseX - simulationParams.current.dragOffset.x,
    //     y: dragStart.current.y + p.mouseY - simulationParams.current.dragOffset.y
    //   };
    // }
    // p.mouseWheel = (e) => {
    //   simulationParams.current.scale = {
    //     x: simulationParams.current.scale.x * ((e.delta < 0)?1.01:0.99),
    //     y: simulationParams.current.scale.y * ((e.delta < 0)?1.01:0.99),
    //   };
    // }
    return () => {
      p.remove();
    }
  }

  return (
    <div className = "dummy_container">
      <div className = "app_container">
        <div className = "title_container">
          <div className = "chart_title">{currentDataPreset.title}</div>
          <div className = "chart_equation" dangerouslySetInnerHTML = {{__html:'Force = '+currentDataPreset.chartEquation}}></div>
        </div>
        {/* holds the p5 canvas */}
        <main></main>
        <div className = "ui_container">
          <div className = "ui_sliders">
            {/* <div className = "ui_slider_container"> */}
              <Slider label = 'Particles' min = {0} max = {UISettings.dataTextureDimension*UISettings.dataTextureDimension} stepsize = {1} value = {UISettings.particleCount} callback = {(val) => {setUISettings({...UISettings,particleCount:val})}}></Slider>
              <Slider label = 'Size' min = {0.1} max = {5} stepsize = {0.01} value = {UISettings.particleSize} callback = {(val) => {setUISettings({...UISettings,particleSize:val})}}></Slider>
              <Slider label = 'Decay' min = {0.01} max = {1.0} stepsize = {0.01} value = {UISettings.trailDecayValue} callback = {(val) => {setUISettings({...UISettings,trailDecayValue:(val)})}}></Slider>
              <Slider label = 'Velocity' min = {0} max = {0.01} stepsize = {0.001} value = {UISettings.particleVelocity} callback = {(val) => {setUISettings({...UISettings,particleVelocity:val})}}></Slider>
              <Slider label = 'Repulsion' min = {0} max = {5} stepsize = {0.01} value = {UISettings.repulsionStrength} callback = {(val) => {setUISettings({...UISettings,repulsionStrength:val})}}></Slider>
              <Slider label = 'Attraction' min = {0} max = {5} stepsize = {0.01} value = {UISettings.attractionStrength} callback = {(val) => {setUISettings({...UISettings,attractionStrength:val})}}></Slider>
              <Slider label = 'Drift' min = {0} max = {10} stepsize = {0.001} value = {UISettings.randomMagnitude} callback = {(val) => {setUISettings({...UISettings,randomMagnitude:val})}}></Slider>
              <Slider label = 'Color Balance' min = {0} max = {2} stepsize = {0.01} value = {UISettings.colorWeight} callback = {(val) => {setUISettings({...UISettings,colorWeight:(val)})}}></Slider>
            {/* </div> */}
          </div>
          <div className = "ui_checkboxes">
            <Checkbox label = "Running" callback = {(val) => {setUISettings({...UISettingsRef.current,isActive:(!UISettingsRef.current.isActive)})}} value = {UISettings.isActive}></Checkbox>
            <Checkbox label = "Census Tract Boundaries" callback = {(val) => {setUISettings({...UISettingsRef.current,renderCensusTracts:(!UISettingsRef.current.renderCensusTracts)})}} value = {UISettings.renderCensusTracts}></Checkbox>
            <Checkbox label = "HOLC Tract Boundaries" callback = {(val) => {setUISettings({...UISettingsRef.current,renderHOLCTracts:(!UISettingsRef.current.renderHOLCTracts)})}} value = {UISettings.renderHOLCTracts}></Checkbox>
            <Checkbox label = "Plot Nodes" callback = {(val) => {setUISettings({...UISettingsRef.current,renderNodes:(!UISettingsRef.current.renderNodes)})}} value = {UISettings.renderNodes}></Checkbox>
            <Checkbox label = "Plot Textures" callback = {(val) => {setUISettings({...UISettingsRef.current,renderFlowFieldDataTexture:(!UISettingsRef.current.renderFlowFieldDataTexture)})}} value = {UISettings.renderFlowFieldDataTexture}></Checkbox>
          </div>
          <div className = "ui_colorpickers">
            <ColorPicker label = "Background" callback = {(rgb) => {setUISettings({...UISettingsRef.current,backgroundColor:rgb})}} value = {UISettings.backgroundColor}></ColorPicker>
            <ColorPicker label = "Attractors" callback = {(rgb) => {setUISettings({...UISettingsRef.current,attractionColor:rgb})}} value = {UISettings.attractionColor}></ColorPicker>
            <ColorPicker label = "Repulsors" callback = {(rgb) => {setUISettings({...UISettingsRef.current,repulsionColor:rgb})}} value = {UISettings.repulsionColor}></ColorPicker>
          </div>
          <div className = "ui_dropdowns">
            <Dropdown label = 'Source Data' callback = {(val) => {
              simulationParams.current.currentPreset = simulationParams.current.presets.findIndex(preset => preset.title === val);
              setCurrentDataPreset({title:val,chartEquation:simulationParams.current.presets[simulationParams.current.currentPreset].chartEquation});
              flowField.current.loadNodes(simulationParams.current.presets[simulationParams.current.currentPreset].nodes,UISettingsRef.current,simulationParams.current);
              flowField.current.updateFlow(UISettingsRef.current,simulationParams.current);
            }} value = {currentDataPreset.title} options = {simulationParams.current.presets.map((preset) => preset.title)}></Dropdown>
            <Dropdown label = 'Set View' callback = {(val) => {
              setCurrentViewPresetTitle(val);
              simulationParams.current.currentViewPreset = simulationParams.current.viewPresets.findIndex(preset => preset.name === val);
              simulationParams.current.offset = {x:simulationParams.current.viewPresets[simulationParams.current.currentViewPreset].x,y:simulationParams.current.viewPresets[simulationParams.current.currentViewPreset].y};
              simulationParams.current.scale = {x:simulationParams.current.viewPresets[simulationParams.current.currentViewPreset].scale,y:simulationParams.current.viewPresets[simulationParams.current.currentViewPreset].scale};
              flowField.current.updateParticleMask(simulationParams.current);
              flowField.current.updateFlow(UISettingsRef.current,simulationParams.current,simulationParams.current);
              flowField.current.resetParticles(UISettingsRef.current,simulationParams.current,simulationParams.current);
              flowField.current.loadNodes(simulationParams.current.presets[simulationParams.current.currentPreset].nodes,UISettingsRef.current,simulationParams.current);
            }} value = {currentViewPresetTitle} options = {simulationParams.current.viewPresets.map((preset) => preset.name)}></Dropdown>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App