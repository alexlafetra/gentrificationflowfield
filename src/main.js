/*
Some inspiration:
https://blog.mapbox.com/how-i-built-a-wind-map-with-webgl-b63022b5537f
https://nullprogram.com/blog/2014/06/29/
https://nullprogram.com/webgl-particles/
https://apps.amandaghassaei.com/gpu-io/examples/fluid/

Future improvements:
get floating point textures working on mobile

To render tract+mask textures:
set canvas size (mainCanvas) to 1000x1000

*/

let flowField;
let holcTexture;
let tractOutlines;
let presetFlowMask;

let gl;
let mainCanvas;
let idBuffer;

const dataTextureDimension = 200;
let drawParticlesProgram;
let drawParticlesProgLocs;

//Presets
let censusDataPresets;

//controls whether or not the sim will load with prerendered data/choropleths
//or with the full dataset, allowing you to explore/experiment
// let devMode = true;
let devMode = false;

const defaultSettings = {
    particleCount : 40000,
    trailDecayValue : 0.04,
    particleSize : 1.4,
    particleAgeLimit : 4,//this*100 ==> how many frames particles live for
    framesBeforeLoop : 60,
    particleVelocity : 0.015,
    flowInfluence : 1.0,
    randomMagnitude : 0.0,
    repulsionStrength : 1,
    attractionStrength : 1,
    canvasSize : 800,
    useParticleMask : true, //for preventing particles from entering oceans
    isActive : true,
    renderFlowFieldDataTexture : false,
    renderCensusTracts: true,
    renderNodes : true,
    renderParticles:true,
    repulsionColor : [20,0,180],
    attractionColor : [255,0,120],
    mouseInteraction : false,
    colorWeight: 1.6
};

const viewPresets = [
    {
        name: "Entire Bay Area",
        x: 125,
        y: 125,
        scale: 280,
        settings: defaultSettings
    },
    {
        name: "Zoom on East Bay/SF/South Bay",
        x: 250,
        y: 225,
        scale: 700,
        settings: defaultSettings
    },
    {
        name: "SF & Alameda County",
        x: 800,
        y: 800,
        scale: 1700,
        settings: defaultSettings
    },
    {
        name: "San Francisco",
        x: 2850,
        y: 2000,
        scale: 5000,
        settings: {
            particleVelocity: 0.05,
            particleCount: 40000,
            trailDecayValue: 0.04,
            particleSize: 1.4,
            randomMagnitude: 0.0,
            renderCensusTracts:true,
            attractionStrength:4.0,
            repulsionStrength:4.0
        }
    },
    {
        name: "Marin",
        x: 3000,
        y: 2800,
        scale: 4000,
        settings: {
            particleVelocity: 0.05,
            particleCount: 40000,
            trailDecayValue: 0.04,
            particleSize: 1.4,
            randomMagnitude: 0.0,
            renderCensusTracts:true,
            attractionStrength:4.0,
            repulsionStrength:4.0
        }
    },
    {
        name: "South Bay",
        x: 32,
        y: 125,
        scale: 500
    },
    {
        name: "San Jose",
        x: 100,
        y: 0,
        scale: 2500,
        settings: {
            particleVelocity: 0.05,
            particleCount: 40000,
            trailDecayValue: 0.04,
            particleSize: 1.4,
            randomMagnitude: 0.0,
            renderCensusTracts:true,
            attractionStrength:3.0,
            repulsionStrength:3.0
        }
    },
    {
        name: "East Bay",
        x: 1200,
        y: 1450,
        scale: 3000,
        settings: {
            particleVelocity: 0.004,
            particleCount: 40000,
            trailDecayValue: 0.02,
            particleSize: 1.4,
            randomMagnitude: 0.0,
            renderCensusTracts:true,
            attractionStrength:1.0,
            repulsionStrength:2.0
        }
    },
    {
        name: "W. Oakland & Berkeley",
        x: 2500,
        y: 2900,
        scale: 6000,
        settings: {
            particleVelocity: 0.05,
            particleCount: 40000,
            trailDecayValue: 0.04,
            particleSize: 1.4,
            randomMagnitude: 0.0,
            renderCensusTracts:true,
            attractionStrength:3.0,
            repulsionStrength:3.0
        }
    },
    {
        name: "Richmond",
        x: 1400,
        y: 1850,
        scale: 3000
    },
    {
        name: "Antioch",
        x: -100,
        y: 700,
        scale: 1000
    }
];

function initGL(){
    drawParticlesProgram = webglUtils.createProgramFromSources(
        gl, [drawParticlesVS, drawParticlesFS]);
    drawParticlesProgLocs = {
        id: gl.getAttribLocation(drawParticlesProgram, 'particleID'),
        uPositionTexture: gl.getUniformLocation(drawParticlesProgram, 'uPositionTexture'),
        uColorTexture: gl.getUniformLocation(drawParticlesProgram, 'uColorTexture'),
        uAttractionTexture: gl.getUniformLocation(drawParticlesProgram, 'uAttractionTexture'),
        uRepulsionTexture: gl.getUniformLocation(drawParticlesProgram, 'uRepulsionTexture'),
        uTextureDimensions: gl.getUniformLocation(drawParticlesProgram, 'uTextureDimensions'),
        uMatrix: gl.getUniformLocation(drawParticlesProgram, 'uMatrix'),
    };
    let ids = new Array(dataTextureDimension*dataTextureDimension).fill(0).map((_, i) => i);
    idBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ids), gl.STATIC_DRAW);
}

function logSettingsToConsole(){
    console.log("const settings = "+JSON.stringify(flowField.flowField.settings));
}

//All this freakin mess because you can't write a floating pt texture to png right now
function saveFlowFieldTexture(){
    const flowFieldTexture = createFramebuffer({width:2000,height:2000,textureFiltering:NEAREST});
    const newShader = createFlowMagnitudeShader(flowField.flowField.NUMBER_OF_ATTRACTORS,flowField.flowField.NUMBER_OF_REPULSORS);
    let calcFlowFieldShader = createShader(newShader.vertexShader,newShader.fragmentShader);
    flowFieldTexture.begin();
    clear();
    shader(calcFlowFieldShader);
    calcFlowFieldShader.setUniform('uCoordinateOffset',[offset.x/mainCanvas.width+0.5,offset.y/mainCanvas.height+0.5]);//adjusting coordinate so they're between 0,1 (instead of -width/2,+width/2)
    calcFlowFieldShader.setUniform('uScale',scale.x);
    calcFlowFieldShader.setUniform('uDimensions',mainCanvas.width);
    calcFlowFieldShader.setUniform('uAttractors',flowField.flowField.attractorArray);
    calcFlowFieldShader.setUniform('uRepulsors',flowField.flowField.repulsorArray);
    calcFlowFieldShader.setUniform('uAttractionStrength',flowField.flowField.settings.attractionStrength);
    calcFlowFieldShader.setUniform('uRepulsionStrength',flowField.flowField.settings.repulsionStrength);
    rect(-flowFieldTexture.width/2,-flowFieldTexture.height/2,flowFieldTexture.width,flowFieldTexture.height);
    flowFieldTexture.end();
    saveCanvas(flowFieldTexture,"flowFieldTexture.png","png");
}
function saveFlowFieldGif(){
    saveGif(flowField.censusDataPreset.title+".gif", Number(flowField.gifLengthTextbox.value()),{units:'frames',delay:10})
}


function loadPresetMaps(){
    presetFlowMask = loadImage("data/prerendered/flowFieldMask.png");
    tractOutlines = loadImage("data/prerendered/censusTractOutlines.png");
    holcTexture = loadImage("data/prerendered/HOLCTractOutlines.png");
}

function preload(){
    if(devMode)
        loadCensusCSVData();
    loadPresetMaps();
}

function renderTransformedImage(img,sf = mainCanvas.width*2/5){
    const rS = (scale.x/sf);//relative scale, bc the png is scaled already
    const dx = -3*mainCanvas.width/4*rS+offset.x;
    const dy = -3*mainCanvas.height/4*rS+offset.y;
    /*
        these ^^ are the condensed versions of: -mainCanvas.width/2*rS+offset.x-mainCanvas.width/4*rS
        Which is basically centering the image on the webGL canvas, scaling that centering by the image scale
        Adding the offset, then subtracting the starting offset (bc the png is already offset)
    */
    const dw = (mainCanvas.width)*rS;
    const dh = (mainCanvas.height)*rS;
    const sx = 0;
    const sy = 0;
    const sw = img.width;
    const sh = img.height;
    image(img,dx,dy,dw,dh,
            sx,sy,sw,sh);
}

function setup_DevMode(){
    createPresets();
    //parsing data and attaching it to tract geometry
    setupMapData();

    //setting the offsets so that the first point in the first shape is centered
    let samplePoint = bayTracts[0].geometry.coordinates[0][0][0];
    geoOffset = {x:-samplePoint[0],y:-samplePoint[1]};
    //the manual offset
    offset = {x:mainCanvas.width/4,y:mainCanvas.height/4};
    let s = mainCanvas.width*2/5;
    scale = {x:s,y:s*(-1)};//manually adjusting the scale to taste

    //drawing background
    // tractOutlines = createFramebuffer({width:width,height:height});
    // tractOutlines.begin();
    // background(0);
    // noStroke();
    // renderTracts(geoOffset,(t) => fill(255,0));
    // tractOutlines.end();
    // saveCanvas(tractOutlines,'background.png','png');

    //drawing tract outlines

    // tractOutlines = createFramebuffer({width:width,height:height});
    // tractOutlines.begin();
    // strokeWeight(1);
    // renderTractOutlines(geoOffset,color(100));
    // tractOutlines.end();
    // saveCanvas(tractOutlines, 'censusTractOutlines.png','png');

    //drawing HOLC outlines

    // tractOutlines = createFramebuffer({width:width,height:height});
    // tractOutlines.begin();
    // strokeWeight(1);
    // renderHOLCTracts(geoOffset,oakHolcTracts);
    // renderHOLCTracts(geoOffset,sfHolcTracts);
    // renderHOLCTracts(geoOffset,sjHolcTracts);
    // tractOutlines.end();
    // saveCanvas(tractOutlines, 'HOLCTractOutlines.png','png');

    flowField = new CensusDataFlowField();

}
function setup_Prerendered(){
    createPremadePresets();
    //the manual offset
    offset = {x:mainCanvas.width/4,y:mainCanvas.height/4};
    let s = mainCanvas.width*2/5;
    scale = {x:s,y:s*(-1)};//manually adjusting the scale to taste
    flowField = new CensusDataFlowField();
}

function logPresets(){
    let i = 0;
    let bigString;
    for(let preset of censusDataPresets){
        let nodes = createNodesFromTracts(preset.demographicFunction);
        bigString += "const preset"+i+"Nodes = "+JSON.stringify(nodes)+";\n";
        i++;
    }
    console.log(bigString);
}

function setup(){
    //create canvas and grab webGL context
    // mainCanvas = createCanvas(4000,4000,WEBGL);
    mainCanvas = createCanvas(defaultSettings.canvasSize,defaultSettings.canvasSize,WEBGL);
    gl = mainCanvas.GL;

    if(devMode)
        setup_DevMode();
    else
        setup_Prerendered();

    initGL();
}

function draw(){
    flowField.run();
}