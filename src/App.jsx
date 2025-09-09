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
import './app.js'
import './main.js'
import './shaders.js'
import p5 from 'p5'
import { createPremadePresets } from './stats.js';
import { CensusDataFlowField } from './app.js';
import { FlowField } from "./flowField";
import { viewPresets } from "./main";
import Dropdown from './components/dropdown.jsx';


function App() {
  const containerRef = useRef();
  const flowField = useRef();
  const [UISettings,setUISettings] = useState({
    devMode : false,
    dataTextureDimension : 200,
    backgroundColor : [255,255,255],
    particleCount : 40000,
    trailDecayValue : 0.04,
    particleSize : 1.6,
    particleAgeLimit : 1,
    framesBeforeLoop : 60,
    particleVelocity : 0.01,
    flowInfluence : 1.0,
    randomMagnitude : 0.0,
    repulsionStrength : 0.8,
    attractionStrength : 0.5,
    canvasSize : 600,
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

  const [currentDataPresetTitle,setCurrentDataPresetTitle] = useState(simulationParams.current.presets[simulationParams.current.currentPreset].title);
  const [currentViewPresetTitle,setCurrentViewPresetTitle] = useState(simulationParams.current.viewPresets[simulationParams.current.currentViewPreset].name);

  //P5 sketch body
  const mainSketch = (p) =>{

    p.setup = async () => {
      simulationParams.current.p5Ref = p;
      //create canvas and grab webGL context
      simulationParams.current.mainCanvas = p.createCanvas(UISettingsRef.current.canvasSize,UISettingsRef.current.canvasSize,p.WEBGL);
      simulationParams.current.gl = simulationParams.current.mainCanvas.GL;

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
      flowField.current = new FlowField(UISettingsRef.current,simulationParams);
    }
    p.draw = () => {
      flowField.current.run(UISettingsRef.current);
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
    <div className = "ui_container">
      <Slider label = 'Particles' min = {0} max = {UISettings.dataTextureDimension*UISettings.dataTextureDimension} stepsize = {1} value = {UISettings.particleCount} callback = {(val) => {setUISettings({...UISettings,particleCount:val})}}></Slider>
      <Slider label = 'Size' min = {0.1} max = {5} stepsize = {0.01} value = {UISettings.particleSize} callback = {(val) => {setUISettings({...UISettings,particleSize:val})}}></Slider>
      <Slider label = 'Decay' min = {0.1} max = {1.0} stepsize = {0.01} value = {UISettings.trailDecayValue} callback = {(val) => {setUISettings({...UISettings,trailDecayValue:(val)})}}></Slider>
      <Slider label = 'Velocity' min = {0} max = {0.01} stepsize = {0.001} value = {UISettings.particleVelocity} callback = {(val) => {setUISettings({...UISettings,particleVelocity:val})}}></Slider>
      <Slider label = 'Repulsion' min = {0} max = {5} stepsize = {0.01} value = {UISettings.repulsionStrength} callback = {(val) => {setUISettings({...UISettings,repulsionStrength:val})}}></Slider>
      <Slider label = 'Attraction' min = {0} max = {5} stepsize = {0.01} value = {UISettings.attractionStrength} callback = {(val) => {setUISettings({...UISettings,attractionStrength:val})}}></Slider>
      <Slider label = 'Color Balance' min = {0.01} max = {0.6} stepsize = {0.01} value = {UISettings.colorWeight} callback = {(val) => {setUISettings({...UISettings,colorWeight:(val)})}}></Slider>
      <Dropdown label = 'Source Data' callback = {(val) => {
        setCurrentDataPresetTitle(val);
        simulationParams.current.currentPreset = simulationParams.current.presets.findIndex(preset => preset.title === val);
        flowField.current.loadNodes(simulationParams.current.presets[simulationParams.current.currentPreset].nodes,UISettingsRef.current);
        flowField.current.updateFlow(UISettingsRef.current);
      }} value = {currentDataPresetTitle} options = {simulationParams.current.presets.map((preset) => preset.title)}></Dropdown>
      <Dropdown label = 'Set View' callback = {(val) => {
        setCurrentViewPresetTitle(val);
        simulationParams.current.currentViewPreset = simulationParams.current.viewPresets.findIndex(preset => preset.name === val);
        simulationParams.current.offset = {x:simulationParams.current.viewPresets[simulationParams.current.currentViewPreset].x,y:simulationParams.current.viewPresets[simulationParams.current.currentViewPreset].y};
        simulationParams.current.scale = {x:simulationParams.current.viewPresets[simulationParams.current.currentViewPreset].scale,y:simulationParams.current.viewPresets[simulationParams.current.currentViewPreset].scale};
      }} value = {currentViewPresetTitle} options = {simulationParams.current.viewPresets.map((preset) => preset.name)}></Dropdown>
    </div>
  )
}

export default App