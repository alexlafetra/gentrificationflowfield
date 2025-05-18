import viewPresets from './viewPresets.js';
import FlowField from './flowField.js';
import defaultSettings from './settings.js';
import createPresets from './statistics.js';

const sketch = (p) => {

    let mainCanvas;
    let gl;
    let censusDataPresets;
    let flowField;
    let viewWindow = {
        offset: {x:0,y:0},
        scale: {x:1,y:1}
    };

    p.setup = async () => {
        if(defaultSettings.devMode)
            loadCensusCSVData();

        const presetFlowMask = await p.loadImage("../data/prerendered/flowFieldMask.png");
        const tractOutlines =  await p.loadImage("../data/prerendered/censusTractOutlines.png");
        const holcTexture =  await p.loadImage("../data/prerendered/HOLCTractOutlines.png");

        //create canvas and grab webGL context
        mainCanvas = p.createCanvas(defaultSettings.canvasSize,defaultSettings.canvasSize,p.WEBGL);
        gl = mainCanvas.GL;
        p.background(0);

        if(defaultSettings.devMode){
            // console.log("creating presets...");
            // createPresets();
            // //parsing data and attaching it to tract geometry
            // setupMapData();
            // //setting the offsets so that the first point in the first shape is centered
            // let samplePoint = bayTracts[0].geometry.coordinates[0][0][0];
            // geoOffset = {x:-samplePoint[0],y:-samplePoint[1]};
        }
        else{
            censusDataPresets = createPresets();
        }
        //the manual offset
        viewWindow.offset = {x:mainCanvas.width/4,y:mainCanvas.height/4};
        let s = mainCanvas.width*2/5;
        viewWindow.scale = {x:s,y:s*(-1)};//manually adjusting the scale to taste

        const flowFieldData = {
            p5inst : p,
            canvas : mainCanvas,
            webGLContext : gl,
            flowFieldMaskImage : presetFlowMask,
            censusTractOutlineImage : tractOutlines,
            holcTractImage : holcTexture,
            viewWindow : viewWindow
        };

        //build the flow field
        flowField = new FlowField(defaultSettings,flowFieldData);
        flowField.loadNodes(censusDataPresets[1].nodes);
        flowField.resetParticles();
        flowField.renderNodes();
        flowField.updateFlow();
    }
    p.draw = () => {
        flowField.run();
    }
};

export default sketch;