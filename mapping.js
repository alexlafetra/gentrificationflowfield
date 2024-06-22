//Using an example taken from: https://mits003.github.io/studio_null/2021/11/geojson-with-p5js/
/*
    Bay Area county codes
    taken from: https://www.weather.gov/hnx/cafips

    Alameda = 001
    Contra Costa = 013
    Marin = 041
    Napa = 055
    SF = 075
    San Mateo = 081
    Santa Clara = 085
    Solano = 095
    Sonoma = 097
*/
/*
    The tract .geojson file was created using the US Census Tract shapefiles from census.gov
    and converting them using QGIS
*/


let bayTracts;//Object with all the tract geo+data 

//CA geometry from https://github.com/arcee123/GIS_GEOJSON_CENSUS_TRACTS/tree/master
//Actually no, they're shapefiles taken from the US Census website and 
//exported as geoJSON files using QGIS
let tractGeometry;

//Raw US census data
let raceData2000;
let raceData2020;
let rentData2000;
let rentData2020;

//conversion forms
let substantiallyChanged2000;
let substantiallyChanged2010;
let conversions2000to2010;
let conversions2010to2020;

//Parameters for viewing the map
let offset;//offset relative to the window
let scale;//scale
let geoOffset;//offset of the geometry

//HOLC tract shapes taken from https://dsl.richmond.edu/panorama/redlining/data
let oakHolcTracts;
let sfHolcTracts;
let sjHolcTracts;

function filterNonBayAreaCounties(data){
    let convertedData = new p5.Table();
    convertedData.columns = data.columns;
    let rowID = 0;
    for(let row of data.getRows()){
        let countyID = row.get('County');
        if(isItInTheBayTho(countyID)){
            convertedData.addRow(row);
        }
        rowID++;
    }
    return convertedData;
}

//Adds rows for tract and county codes
function getTractAndCountyCodes(data){
    //adding 6-digit tract id's for 2000
    data.addColumn('Tract');
    // const TRACT_COLUMN_ID = data.getColumnCount()-1;
    data.addColumn('County');
    // const COUNTY_COLUMN_ID = data.getColumnCount()-1;

    let rows = data.getRows();
    for(let row of rows){
        let GEOID = row.get("GEOID");
        row.set('Tract',GEOID.slice(-6));
        row.set('County',GEOID.slice(-9,-6));
    }
} 

//prints out a tract in the console (for debugging)
function search(tractID,column){
    let tract2000 = raceData2000.findRows(tractID,column);
    console.log("2000:");
    console.log(tract2000);
    let tract2020 = raceData2020.findRows(tractID,column);
    console.log("2020:");
    console.log(tract2020);
}

//calculate the arithmetic mean (centroid) of each shape
function calculateGeographicCenters(){
    let tracts = bayTracts;
    for(let tract of tracts){
        let geom = tract.geometry;
        let polygons = geom.coordinates;
        let coords = polygons[0][0];
        let centroid = {x:0,y:0};
        for (let j = 0; j < coords.length; j++) {
            centroid.x += coords[j][0];
            centroid.y += coords[j][1];
        }
        centroid.x /= coords.length;
        centroid.y /= coords.length;
        tract.centroid = centroid;
    }
}

//checks if a county code is within the 9 bay area counties
function isItInTheBayTho(countyCode){
    switch(countyCode){
        //AC county
        case '001':
            return true;
        case '013':
            return true;
        case '041':
            return true;
        case '055':
            return true;
        case '075':
            return true;
        case '081':
            return true;
        case '085':
            return true;
        case '095':
            return true;
        case '097':
            return true;
    }
    return false;
}

function alignGeoAndData(features){
    bayTracts = [];
    missingTracts = [];
    for(let tract of features){
        let countyFIPSCode = tract.properties.COUNTYFP;
        //if it's not in the bay, skip it!
        if(!isItInTheBayTho(countyFIPSCode)){
            continue;
        }
        // get tract id from the geojson file
        let tractID = tract.properties.TRACTCE;
        // use that id to lookup the racial demographic data from 2000
        // let row2000 = raceData2000.findRow(tractID,'Tract Number');
        let raceRow2000 = raceData2000.findRow(tractID,'Tract');
        if(!raceRow2000){
            tract.hasRaceData2000 = false;
            missingTracts.push(tractID+" -- 2000 (RACE)");
        }
        let raceRow2020 = raceData2020.findRow(tractID,'Tract');
        if(!raceRow2020){
            tract.hasRaceData2020 = false;
            missingTracts.push(tractID+" -- 2020 (RACE)");
        }
        let rentRow2000 = rentData2000.findRow(tractID,'Tract');
        if(!rentRow2000){
            tract.hasRentData2000 = false;
            missingTracts.push(tractID+" -- 2000 (RENT)");
        }
        let rentRow2020 = rentData2020.findRow(tractID,'Tract');
        if(!rentRow2000){
            tract.hasRentData2020 = false;
            missingTracts.push(tractID+" -- 2000 (RENT)");
        }
        //add that data to the tract object, if you found some data
        if(raceRow2000 && raceRow2020 && rentRow2000 && rentRow2020){
            //if there are people in the tract
            if(raceRow2000.get('Total') > 0 && raceRow2020.get('Total') > 0){
                tract.raceData2000 = raceRow2000;
                tract.raceData2020 = raceRow2020;
                tract.rentData2000 = rentRow2000;
                tract.rentData2020 = rentRow2020;
                tract.hasData = true;
            }
        }
        else{
            tract.hasData = false;
        }
        bayTracts.push(tract);
    }
    if(missingTracts.length){
        console.log("Missing tracts:");
        for(let i of missingTracts){
            console.log(i);
        }
    }
}


function renderCentroids(geometryOffset){
    //rendering each tract
    for(let tract of bayTracts){
        if(!tract.hasData)
            continue;
        stroke(0,255,0);
        if(tract.isClicked){
            fill(255);
        }
        else{
            noFill();
        }
        let x = (tract.centroid.x+geometryOffset.x)*scale.x+offset.x;
        let y = (tract.centroid.y+geometryOffset.y)*scale.y+offset.y;
        ellipse(x,y,10,10);
    }
}

function drawTract(geometry,geometryOffset){
    let polygons = geometry.coordinates[0];
    let coords = polygons[0];
    beginShape();
    for (let j = 0; j < coords.length; j++) {
        let x = (coords[j][0]+geometryOffset.x)*scale.x+offset.x;
        let y = (coords[j][1]+geometryOffset.y)*scale.y+offset.y;
        vertex(x,y);
    }
    endShape(CLOSE);
}

//Draws tract geometry, can be filled for different data visualizations
function renderTracts(geometryOffset,colorstyle){
    //rendering each tract
    for(let tract of bayTracts){
        if(tract.hasData){
            colorstyle(tract);
        }
        else{
            continue;
        }
        noStroke();
        drawTract(tract.geometry,geometryOffset);
    }
}

function renderTractOutlines(geometryOffset,color){
    //rendering each tract
    stroke(color);
    clear();
    noFill();
    for(let tract of bayTracts){
        drawTract(tract.geometry,geometryOffset);
    }
}

let indexOfClickedTract = -1;

function printDemographics(tract){
    console.log("-------- Demographics --------");
    console.log("Total | 2000 | 2020")
    console.log("      "+round(tract.raceData2000.get('Total'))+"|"+round(tract.raceData2020.get('Total')));
    console.log("White | 2000 | 2020")
    console.log("      "+round(tract.raceData2000.get('White'))+"|"+round(tract.raceData2020.get('White')));
    console.log("Black | 2000 | 2020")
    console.log("      "+round(tract.raceData2000.get('Black'))+"|"+round(tract.raceData2020.get('Black')));
    console.log("Asian | 2000 | 2020")
    console.log("      "+round(tract.raceData2000.get('Asian'))+"|"+round(tract.raceData2020.get('Asian')));
}

function clickClosestCentroid(coord){
    let closestDistance = null;
    let closestIndex = 0;
    let i = 0;
    let foundAtLeastOne = false;
    for(let tract of bayTracts){
        let x = (tract.centroid.x+geoOffset.x)*scale.x+offset.x;
        let y = (tract.centroid.y+geoOffset.y)*scale.y+offset.y;
        let v = createVector(x,y);
        let d = p5.Vector.dist(v,coord);
        if(d<closestDistance || closestDistance == null){
            closestDistance = d;
            closestIndex = i;
            foundAtLeastOne = true;
        }
        i++;
        tract.isClicked = false;
    }
    if(!foundAtLeastOne)
        return;
    let tract = bayTracts[closestIndex];
    bayTracts[closestIndex].isClicked = true;
    indexOfClickedTract = closestIndex;
    stroke(255);
}

function click(tract){
    bayTracts[tract].isClicked = true;
}


//draws HOLC tracts as line drawings
function renderHOLCTracts(geometryOffset,holcTracts){
    //rendering each tract
    strokeWeight(1);
    noFill();
    for(let tract of holcTracts.features){
        let polygons = tract.geometry.coordinates;
        let grade = tract.properties.grade;
        let color;
        switch(grade){
            case 'A':
                continue;
                color = {r:100,g:100,b:255};
                break;
            case 'B':
                continue;
                color = {r:100,g:200,b:155};
                break;
            case 'C':
                continue;
                color = {r:255,g:215,b:0};
                break;
            case 'D':
                color = {r:255,g:0,b:0};
                break;
            case null:
                continue;
        }
        stroke(color.r,color.g,color.b);

        //these are multipolygons, so you need to iterate over each one
        for(let shape of polygons){
            beginShape();
            let coords = shape[0];
            for (let j = 0; j < coords.length; j++) {
                let x = (coords[j][0]+geometryOffset.x)*scale.x+offset.x;
                let y = (coords[j][1]+geometryOffset.y)*scale.y+offset.y;
                vertex(x,y);
            }
            endShape(CLOSE);
        }
    }
}

function renderMap(tex,bg,colorStyle){
    tex.begin();
    background(bg);
    renderTracts(geoOffset,colorStyle);
    tex.end();
}

function renderMapOutline(c){

    mapTexture.begin();
    renderTractOutlines(geoOffset,c);

    let sigPoints = getSignificantPoints(mostWhiteChange,5);
    for(let i = 0; i<sigPoints.length; i++){
        push();
        strokeWeight(5);
        stroke(255,0,0);
        let x = (sigPoints[i].x+geoOffset.x)*scale.x+offset.x;
        let y = (sigPoints[i].y+geoOffset.y)*scale.y+offset.y;
        translate(x,y);
        point(0,0);
        pop();
    }
    mapTexture.end();

}

function setupMapData(){
    let features = tractGeometry.features;
    bayTracts = features;
    cleanCensusData();
    alignGeoAndData(features);
    getTotalStats();
    calculateGeographicCenters();
}

function setupMap(){
    //drawing tract outlines to an overlay
    tractOutlines.begin();
    strokeWeight(1);
    renderTractOutlines(geoOffset,color(100,180));
    tractOutlines.end();


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
}

function setViewToSanFrancisco(){
    let s = mainCanvas.width;
    scale = {x:s,y:-s};
    offset = {x:mainCanvas.width/16,y:mainCanvas.height/4};
    setupMap();
    flowField.calculateAttractors(NUMBER_OF_ATTRACTORS);
    flowField.updateFlow();
}