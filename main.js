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
        name: "Bay Area",
        x: 125,
        y: 125,
        scale: 200
    },
    {
        name: "San Francisco",
        x: 0,
        y: 0,
        scale: 1
    },
    {
        name: "San Jose",
        x: 32,
        y: 125,
        scale: 500
    },
    {
        name: "West Oakland",
        x: 32,
        y: 125,
        scale: 500
    }

];

let activeViewPreset = 0;

class DemographicVis{
    constructor(title,description,data){
        this.title = title;
        this.description = description;
        this.demographicFunction = data;
    }
    setActive(index,ff){
        ff.chartTitle.html(this.title);
        ff.chartEquation.html(this.description);
        ff.presetIndex = index;
        ff.calculateAttractors(NUMBER_OF_ATTRACTORS,this.demographicFunction);
        ff.updateFlow();
    }
}

class Preset{
    constructor(title,description,aPoints,rPoints){
        this.title = title;
        this.description = description;
        this.attractors = aPoints;
        this.repulsors = rPoints;
    }
    setActive(index,ff){
        ff.chartTitle.html(this.title);
        ff.chartEquation.html(this.description);
        ff.presetIndex = index;
        ff.setPresetAttractors();
        ff.updateFlow();
    }
}

function saveTracts(){
    saveJSON(bayTracts,"tracts.json");
}

//you gotta be in devmode for this!
//renders tracts to a canvas, then saves it
function saveTractOutlines(){
    const temp = createFramebuffer({width:6000,height:6000});
    const oldScale = scale;
    // scale.x*=1;
    // scale.y*=1;
    temp.begin();
    scale(5,5,5);
    background(0,0);
    strokeWeight(1);
    renderTractOutlines(geoOffset,color(0));
    temp.end();
    saveCanvas(temp, 'censusTractOutlines.png','png');
}

function saveHOLCOutlines(){
    const temp = createFramebuffer({width:1000,height:1000});
    const oldScale = scale;
    // scale.x*=5;
    // scale.y*=5;
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

    flowField = new FlowField(0);
    flowField.calculateAttractors(NUMBER_OF_ATTRACTORS);
}

function setup_Prerendered(){
    createPremadePresets();
    //the manual offset
    offset = {x:mainCanvas.width/4,y:mainCanvas.height/4};
    let s = mainCanvas.width*2/5;
    scale = {x:s,y:s*(-1)};//manually adjusting the scale to taste
    flowField = new FlowField(0);
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

function setup(){
    //create canvas and grab webGL context
    mainCanvas = createCanvas(500,500,WEBGL);
    gl = mainCanvas.GL;
    randomShader = createShader(defaultVert,randomFrag);

    if(devMode)
        setup_DevMode();
    else
        setup_Prerendered();

    initGL();

    presets[0].setActive(0,flowField);
}

function draw(){
    flowField.updateParametersFromGui();
    if(flowField.isActive){
        flowField.updateParticles();
        flowField.renderGL();
        if(flowField.showingData)
            flowField.renderData();
        if(flowField.renderAs){
            flowField.renderAttractors();
        }
        if(flowField.renderRs){
            flowField.renderRepulsors();
        }
    }
}