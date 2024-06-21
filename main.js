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
const NUMBER_OF_FIELDS = 1;

//controls whether or not the sim will load with prerendered data/choropleths
//or with the full dataset, allowing you to explore/experiment
const devMode = true;
// const devMode = false;

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
        console.log(ff.attractors);
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
        loadData();
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
    whiteRatioPreset = new DemographicVis("Ratio of Proportions of Population Identifying as White",
                                            "(P<sub>White 2000</sub> / P<sub>Total 2000</sub>) / (P<sub>White 2020</sub> / P<sub>Total 2020</sub>)",ratioWhiteChange);
    blackRatioPreset = new DemographicVis("Ratio of Proportions of Population Identifying as Black",
                                            "(P<sub>Black 2000</sub> / P<sub>Total 2000</sub>) / (P<sub>Black 2020</sub> / P<sub>Total 2020</sub>)",ratioBlackChange);
    asianRatioPreset = new DemographicVis("Ratio of Proportions of Population Identifying as Asian",
                                            "(P<sub>Asian 2000</sub> / P<sub>Total 2000</sub>) / (P<sub>Asian 2020</sub> / P<sub>Total 2020</sub>)",ratioAsianChange);
    rentBurdenPreset = new DemographicVis("Renters spending more than 50% of monthly income on rent in 2000","afeafeaoin",highRentBurden);
    presets = [
        whiteProportionComparisonPreset,
        blackProportionComparisonPreset,
        asianProportionComparisonPreset,
        whiteComparisonPreset,
        blackComparisonPreset,
        asianComparisonPreset,
        whiteRatioPreset,
        blackRatioPreset,
        asianRatioPreset,
        rentBurdenPreset
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
    renderTractOutlines(geoOffset,color(255));
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

    whiteRatioPreset = new Preset("Ratio of Proportions of Population Identifying as White",
                                            "(P<sub>White 2000</sub> / P<sub>Total 2000</sub>) / (P<sub>White 2020</sub> / P<sub>Total 2020</sub>)",6,preset6Attractors,preset6Repulsors);
    blackRatioPreset = new Preset("Ratio of Proportions of Population Identifying as Black",
                                            "(P<sub>Black 2000</sub> / P<sub>Total 2000</sub>) / (P<sub>Black 2020</sub> / P<sub>Total 2020</sub>)",7,preset7Attractors,preset7Repulsors);
    asianRatioPreset = new Preset("Ratio of Proportions of Population Identifying as Asian",
                                            "(P<sub>Asian 2000</sub> / P<sub>Total 2000</sub>) / (P<sub>Asian 2020</sub> / P<sub>Total 2020</sub>)",8,preset8Attractors,preset8Repulsors);
    presets = [
        whiteProportionComparisonPreset,
        blackProportionComparisonPreset,
        asianProportionComparisonPreset,
        whiteComparisonPreset,
        blackComparisonPreset,
        asianComparisonPreset,
        whiteRatioPreset,
        blackRatioPreset,
        asianRatioPreset
    ];

    //creating map mask
    mask.begin();
    image(presetFlowMask,-mask.width/2,-mask.height/2,mask.width,mask.height);
    mask.end();
    flowField = new FlowField(mask,0,null,randomColor());
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


    // saveTable(rentData2000,'CONVERTED_Tracts_by_Rent_2000.csv');
    mask = createFramebuffer({width:width,height:height});
    
    if(devMode)
        setup_DevMode();
    else
        setup_Prerendered();

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
    }
}