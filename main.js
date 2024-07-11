/*

Some inspiration:
https://blog.mapbox.com/how-i-built-a-wind-map-with-webgl-b63022b5537f
https://nullprogram.com/blog/2014/06/29/
https://nullprogram.com/webgl-particles/
https://apps.amandaghassaei.com/gpu-io/examples/fluid/

Future improvements:
get floating point textures working on mobile
combine vel+position processing into one texture+shader pass?

To render tract+mask textures:
set canvas size (mainCanvas) to 1000x1000

Add in something about financial policy

*/

let flowField;
let flowFields = [];
let holcTexture;
let mask;
let presetFlowMask;

let attractors = [];
let repulsors = [];
let gl;
let mainCanvas;
let tractOutlines;
let idBuffer;
let ids;

let dataTextureDimension = 200;
let randomShader;
let drawParticlesProgram;
let drawParticlesProgLocs;

//Presets
let presets;

//20 is a good base number
const NUMBER_OF_ATTRACTORS = 300;

//controls whether or not the sim will load with prerendered data/choropleths
//or with the full dataset, allowing you to explore/experiment
// let devMode = true;
let devMode = false;

const viewPresets = [
    {
        name: "Entire Bay Area",
        x: 125,
        y: 125,
        scale: 280
    },
    {
        name: "San Francisco",
        x: 1150,
        y: 750,
        scale: 2000
    },
    {
        name: "San Jose/East Oakland",
        x: 32,
        y: 125,
        scale: 500
    },
    {
        name: "Berkeley/Oakland",
        x: 1200,
        y: 1450,
        scale: 3000
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
        id: gl.getAttribLocation(drawParticlesProgram, 'id'),
        uPositionTexture: gl.getUniformLocation(drawParticlesProgram, 'uPositionTexture'),
        uColorTexture: gl.getUniformLocation(drawParticlesProgram, 'uColorTexture'),
        uAttractionTexture: gl.getUniformLocation(drawParticlesProgram, 'uAttractionTexture'),
        uRepulsionTexture: gl.getUniformLocation(drawParticlesProgram, 'uRepulsionTexture'),
        uTextureDimensions: gl.getUniformLocation(drawParticlesProgram, 'uTextureDimensions'),
        uMatrix: gl.getUniformLocation(drawParticlesProgram, 'uMatrix'),
    };
    ids = new Array(dataTextureDimension*dataTextureDimension).fill(0).map((_, i) => i);
    idBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ids), gl.STATIC_DRAW);
}

function fillFBOwithRandom(fbo,scale,seed){
    fbo.begin();
    shader(randomShader);
    randomShader.setUniform('uScale',scale);
    randomShader.setUniform('uRandomSeed',seed);
    quad(-1,-1,-1,1,1,1,1,-1);
    fbo.end();
}

function saveFlowFieldGif(){
    saveGif(presets[flowField.presetIndex].title+".gif", Number(flowField.gifLengthTextbox.value()),{units:'frames',delay:10})
}

function saveTracts(){
    saveJSON(bayTracts,"tracts.json");
}

//you gotta be in devmode for this!
//renders tracts to a canvas, then saves it
function saveTractOutlines(){
    const temp = createFramebuffer({width:width,height:height});
    temp.begin();
    background(0,0);
    strokeWeight(1);
    renderTractOutlines(geoOffset,color(0));
    temp.end();
    saveCanvas(temp, 'censusTractOutlines.png','png');
}

function saveHOLCOutlines(){
    const temp = createFramebuffer({width:width,height:height});
    temp.begin();
    background(0,0);
    renderHOLCTracts(geoOffset,oakHolcTracts);
    renderHOLCTracts(geoOffset,sfHolcTracts);
    renderHOLCTracts(geoOffset,sjHolcTracts);
    temp.end();
    saveCanvas(temp, 'HOLCTracts.png','png');
}

function loadPresetMaps(){
    presetFlowMask = loadImage("data/Prerendered/flowFieldMask.png");
    tractOutlines = loadImage("data/Prerendered/censusTractOutlines.png");
    holcTexture = loadImage("data/Prerendered/HOLC_Red.png");
}

function preload(){
    if(devMode)
        loadCensusCSVData();
    loadPresetMaps();
}

function randomColor(){
    return color(random(0,255),random(0,255),random(0,255));
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

    // tractOutlines = createFramebuffer({width:width,height:height});
    // tractOutlines.begin();
    // strokeWeight(1);
    // renderTractOutlines(geoOffset,color(100));
    // tractOutlines.end();
    // saveCanvas(tractOutlines, 'censusTractOutlines.png','png');

    flowField = new CensusDataFlowField();
    flowField.setFlowFieldNodes();
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
    for(let preset of presets){
        let a = getSignificantPoints(NUMBER_OF_ATTRACTORS,preset.demographicFunction);
        let r = getLeastSignificantPoints(NUMBER_OF_ATTRACTORS,preset.demographicFunction);
        bigString += "\nconst preset"+i+"Attractors = "+JSON.stringify(a)+";";
        bigString += "\nconst preset"+i+"Repulsors = "+JSON.stringify(r)+";";
        i++;
    }
    console.log(bigString);
}

let initialStartingPositions;

function setup(){
    //create canvas and grab webGL context
    mainCanvas = createCanvas(700,700,WEBGL);
    gl = mainCanvas.GL;
    randomShader = createShader(updateParticleDataVert,randomFrag);

    //this is only used for making looping animations!
    initialStartingPositions = createFramebuffer({width:dataTextureDimension,height:dataTextureDimension,format:FLOAT,textureFiltering:NEAREST,depth:false});
    fillFBOwithRandom(initialStartingPositions,1.0,1.1);

    if(devMode)
        setup_DevMode();
    else
        setup_Prerendered();

    initGL();
    background(255);
}

function draw(){
    flowField.run();
}