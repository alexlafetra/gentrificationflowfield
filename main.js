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


//Presets
let whiteComparisonPreset;
let blackComparisonPreset;
let asianComparisonPreset;
let whiteProportionComparisonPreset;
let blackProportionComparisonPreset;
let asianProportionComparisonPreset;
let whiteRatioPreset;
let blackRatioPreset;
let asianRatioPreset;
let rentBurdenPreset;

let presets;

// Look for moving/migration data

//20 is a good base number
let NUMBER_OF_ATTRACTORS = 300;
// let NUMBER_OF_ATTRACTORS = 20;
const NUMBER_OF_FIELDS = 1;

//controls whether or not the sim will load with prerendered data/choropleths
//or with the full dataset, allowing you to explore/experiment
// let devMode = true;
let devMode = false;

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
    constructor(title,description,map,aPoints,rPoints){
        this.title = title;
        this.description = description;
        this.mapIndex = map;
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
function saveFlowField(){
    saveCanvas(flowField.flowFieldTexture,'flowfield.png','png');
}
function saveChoropleth(){
    saveCanvas(flowField.mapTexture, 'choropleth.png','png');
}
function saveMask(){
    saveCanvas(flowField.particleMask, 'flowFieldMask.png','png');
}
function saveTracts(){
    saveJSON(bayTracts,"tracts.json");
}
function saveOutlines(){
    saveCanvas(tractOutlines, 'flowFieldMask.png','png');
}

function loadPresetMaps(){
    presetFlowMask = loadImage("data/Prerendered/flowFieldMask.png");
    tractOutlines = loadImage("data/Prerendered/tractOutlines.png");
    holcTexture = loadImage("data/Prerendered/HOLC_Red.png");
}

function logAttractorsDevmode(){
    let count = 0;
    let string;
    for(let i of presets){
        i.setActive(count,flowField);
        string += flowField.logFlowFieldData("preset"+count);
        count++;
    }
    console.log(string);
}

function preload(){
    if(devMode)
        loadCensusCSVData();
    else
        loadPresetMaps();
}

//20 is about the limit
function gatherDemographicMaxMins(n){
    let points = getSignificantPoints(n);
    points = points.concat(getLeastSignificantPoints(n));
    return points;
}


function randomColor(){
    return color(random(0,255),random(0,255),random(0,255));
}

function setup_DevMode(){
    //Preset color/flows
    whiteComparisonPreset = new DemographicVis("Change in White Population",
                                            "P<sub>White 2020</sub> - P<sub>White 2000</sub>",whitePeopleChange);
    blackComparisonPreset = new DemographicVis("Change in Black Population",
                                                "P<sub>Black 2020</sub> - P<sub>Black 2000</sub>",blackPeopleChange);
    asianComparisonPreset = new DemographicVis("Change in Asian Population",
                                                "P<sub>Asian 2020</sub> - P<sub>Asian 2000</sub>",asianPeopleChange);
    whiteProportionComparisonPreset = new DemographicVis("Change In Proportion of Population Identifying as White",
                                            "P<sub>White 2000</sub> / P<sub>Total 2000</sub> - P<sub>White 2020</sub> / P<sub>Total 2020</sub>",proportionalWhiteChange);
    blackProportionComparisonPreset = new DemographicVis("Change In Proportion of Population Identifying as Black",
                                            "P<sub>Black 2000</sub> / P<sub>Total 2000</sub> - P<sub>Black 2020</sub> / P<sub>Total 2020</sub>",proportionalBlackChange);
    asianProportionComparisonPreset = new DemographicVis("Change In Proportion of Population Identifying as Asian",
                                            "P<sub>Asian 2000</sub> / P<sub>Total 2000</sub> - P<sub>Asian 2020</sub> / P<sub>Total 2020</sub>",proportionalAsianChange);
    rentBurden1= new DemographicVis("Renters spending less than 10% of monthly income","idk",rentBurdenLessThan10);
    rentBurden2= new DemographicVis("Renters spending 10-14% of monthly income","idk",rentBurden10to14);
    rentBurden3= new DemographicVis("Renters spending 15-19% of monthly income","idk",rentBurden15to19);
    rentBurden4= new DemographicVis("Renters spending 20-24% of monthly income","idk",rentBurden20to24);
    rentBurden5= new DemographicVis("Renters spending 25-29% of monthly income","idk",rentBurden25to29);
    rentBurden6= new DemographicVis("Renters spending 30-34% of monthly income","idk",rentBurden30to34);
    rentBurden7= new DemographicVis("Renters spending 35-39% of monthly income","idk",rentBurden35to39);
    rentBurden8= new DemographicVis("Renters spending 40-49% of monthly income","idk",rentBurden40to49);
    rentBurden9= new DemographicVis("Renters spending more than 50% of monthly income","idk",rentBurden50orMore);

    presets = [
        whiteProportionComparisonPreset,
        blackProportionComparisonPreset,
        asianProportionComparisonPreset,
        whiteComparisonPreset,
        blackComparisonPreset,
        asianComparisonPreset,
        rentBurden1,
        rentBurden2,
        rentBurden3,
        rentBurden4,
        rentBurden5,
        rentBurden6,
        rentBurden7,
        rentBurden8,
        rentBurden9
    ];

    //parsing data and attaching it to tract geometry
    setupMapData();

    //setting the offsets so that the first point in the first shape is centered
    let samplePoint = bayTracts[0].geometry.coordinates[0][0][0];
    geoOffset = {x:-samplePoint[0],y:-samplePoint[1]};

    //the manual offset
    offset = {x:mainCanvas.width/4,y:mainCanvas.height/4};

    //manually adjusting the scale to taste
    let s = mainCanvas.width*2/5;
    scale = {x:s,y:s*(-1)};

    //drawing tract outlines to an overlay
    tractOutlines = createFramebuffer({width:width,height:height});
    tractOutlines.begin();
    strokeWeight(1);
    renderTractOutlines(geoOffset,color(100,10));
    tractOutlines.end();

    holcTexture = createFramebuffer(width,height);

    holcTexture.begin();
    renderHOLCTracts(geoOffset,oakHolcTracts);
    renderHOLCTracts(geoOffset,sfHolcTracts);
    renderHOLCTracts(geoOffset,sjHolcTracts);
    holcTexture.end();

    //creating map mask
    mask.begin();
    background(0,255);
    renderTracts(geoOffset,() => {fill(255,255,255)});
    mask.end();

    flowField = new FlowField(mask,0,null,randomColor());
    flowField.calculateAttractors(NUMBER_OF_ATTRACTORS);
}

function setup_Prerendered(){
    whiteComparisonPreset = new Preset("Change in White Population",
                                            "P<sub>White 2000</sub> - P<sub>White 2020</sub>",0,preset0Attractors,preset0Repulsors);
    blackComparisonPreset = new Preset("Change in Black Population",
                                            "P<sub>Black 2000</sub> - P<sub>Black 2020</sub>",1,preset1Attractors,preset1Repulsors);
    asianComparisonPreset = new Preset("Change in Asian Population",
                                            "P<sub>Asian 2000</sub> - P<sub>Asian 2020</sub>",2,preset2Attractors,preset2Repulsors);
    whiteProportionComparisonPreset = new Preset("Change In Proportion of Population Identifying as White",
                                            "P<sub>White 2000</sub> / P<sub>Total 2000</sub> - P<sub>White 2020</sub> / P<sub>Total 2020</sub>",3,preset3Attractors,preset3Repulsors);
    blackProportionComparisonPreset = new Preset("Change In Proportion of Population Identifying as Black",
                                            "P<sub>Black 2000</sub> / P<sub>Total 2000</sub> - P<sub>Black 2020</sub> / P<sub>Total 2020</sub>",4,preset4Attractors,preset4Repulsors);
    asianProportionComparisonPreset = new Preset("Change In Proportion of Population Identifying as Asian",
                                            "P<sub>Asian 2000</sub> / P<sub>Total 2000</sub> - P<sub>Asian 2020</sub> / P<sub>Total 2020</sub>",5,preset5Attractors,preset5Repulsors);

    rentBurden1= new Preset("Renters spending less than 10% of monthly income","idk",9,preset6Attractors,preset6Repulsors);
    rentBurden2= new Preset("Renters spending 10-14% of monthly income","idk",10,preset7Attractors,preset7Repulsors);
    rentBurden3= new Preset("Renters spending 15-19% of monthly income","idk",11,preset8Attractors,preset8Repulsors);
    rentBurden4= new Preset("Renters spending 20-24% of monthly income","idk",12,preset9Attractors,preset9Repulsors);
    rentBurden5= new Preset("Renters spending 25-29% of monthly income","idk",13,preset10Attractors,preset10Repulsors);
    rentBurden6= new Preset("Renters spending 30-34% of monthly income","idk",14,preset11Attractors,preset11Repulsors);
    rentBurden7= new Preset("Renters spending 35-39% of monthly income","idk",15,preset12Attractors,preset12Repulsors);
    rentBurden8= new Preset("Renters spending 40-49% of monthly income","idk",16,preset13Attractors,preset13Repulsors);
    rentBurden9= new Preset("Renters spending more than 50% of monthly income","idk",17,preset14Attractors,preset14Repulsors);

    presets = [
        whiteProportionComparisonPreset,
        blackProportionComparisonPreset,
        asianProportionComparisonPreset,
        whiteComparisonPreset,
        blackComparisonPreset,
        asianComparisonPreset,
        rentBurden1,
        rentBurden2,
        rentBurden3,
        rentBurden4,
        rentBurden5,
        rentBurden6,
        rentBurden7,
        rentBurden8,
        rentBurden9
    ];

    //creating map mask
    mask.begin();
    image(presetFlowMask,-mask.width/2,-mask.height/2,mask.width,mask.height);
    mask.end();
    flowField = new FlowField(mask,0,null,randomColor());
}

function mousePressed(){
    // flowField.logClosestAttractorToMouse();
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
    // setAttributes('antialias',false);

    // pixelDensity(1);
    mainCanvas = createCanvas(500,500,WEBGL);
    gl = mainCanvas.GL;
    randomShader = createShader(defaultVert,randomFrag);

    mask = createFramebuffer({width:width,height:height});
    
    if(devMode)
        setup_DevMode();
    else
        setup_Prerendered();

    // saveTable(rentData2000,'CONVERTED_Tracts_by_Rent_2000.csv');

    initGL();

    presets[0].setActive(0,flowField);
}

function renderFlowFields(){
    for(let i = 0; i<flowFields.length; i++){
        image(flowFields[i].flowFieldTexture,-width/2+i*width/4,height/2-height/4,width/4,height/4);
    }
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