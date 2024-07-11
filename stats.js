//Storing some overall totals in the "totalStats" object
let totalStats;

function raceRatio2020to2000(tract,field){
    if(tract.raceData2000 == undefined || tract.raceData2020 == undefined)
        return 0;
    const val = tract.raceData2020.obj[field]/tract.raceData2000.obj[field];
    if(val == NaN)
        return 0;
    if(val == Infinity)
        return 0;
    if(!val)
        return 0;
    return val;
}

function whitePeopleComparedTo2000(tract){
    return raceRatio2020to2000(tract,'White');
}
function blackPeopleComparedTo2000(tract){
    return raceRatio2020to2000(tract,'Black');
}
function asianPeopleComparedTo2000(tract){
    return raceRatio2020to2000(tract,'Asian');
}
function hispanicOrLatinoPeopleComparedTo2000(tract){
    return raceRatio2020to2000(tract,'Total races tallied for householders!!Total races tallied for Not Hispanic or Latino householders');
}

function raceDifference(tract,field){
    if(tract.raceData2000 == undefined || tract.raceData2020 == undefined)
        return 0;
    const val = tract.raceData2020.obj[field] - tract.raceData2000.obj[field];
    if(val == NaN)
        return 0;
    if(val == Infinity)
        return 0;
    if(!val)
        return 0;
    return val;
}

function whitePeopleChange(tract){
    return raceDifference(tract,'White');
}
function blackPeopleChange(tract){
    return raceDifference(tract,'Black');
}
function asianPeopleChange(tract){
    return raceDifference(tract,'Asian');
}
function hispanicOrLatinoPeopleChange(tract){
    return raceDifference(tract,'Total races tallied for householders!!Total races tallied for Not Hispanic or Latino householders');
}

function raceChangeInProportion(tract,field){
    if(tract.raceData2000 == undefined || tract.raceData2020 == undefined)
        return 0;
    const val = (tract.raceData2020.obj[field]/tract.raceData2020.obj.Total) - (tract.raceData2000.obj[field]/tract.raceData2000.obj.Total);
    if(val == NaN)
        return 0;
    if(val == Infinity)
        return 0;
    if(!val)
        return 0;
    return val;
}

function proportionalWhiteChange(tract){
    return raceChangeInProportion(tract,'White');
}
function proportionalBlackChange(tract){
    return raceChangeInProportion(tract,'Black');
}
function proportionalAsianChange(tract){
    return raceChangeInProportion(tract,'Asian');
}
function proportionalHispOrLatinoChange(tract){
    return raceChangeInProportion(tract,'Total races tallied for householders!!Total races tallied for Not Hispanic or Latino householders');
}

function ratioWhiteChange(tract){
    return (tract.raceData2020.obj.White/tract.raceData2020.obj.Total) / (tract.raceData2000.obj.White/tract.raceData2000.obj.Total);
}
function ratioBlackChange(tract){
    if(tract.raceData2000 == undefined || tract.raceData2020 == undefined)
        return 0;
    let val = (tract.raceData2020.obj.Black/tract.raceData2020.obj.Total) / (tract.raceData2000.obj.Black/tract.raceData2000.obj.Total);
    return val;
}
function ratioAsianChange(tract){
    return (tract.raceData2020.obj.Asian/tract.raceData2020.obj.Total) / (tract.raceData2000.obj.Asian/tract.raceData2000.obj.Total);
}

function rentBurden(tract,field){
    if(tract.rentData2000 == undefined || tract.rentData2020 == undefined){
        return 0;
    }
    let val = tract.rentData2020.obj[field]-tract.rentData2000.obj[field];
    if(val == NaN)
        return 0;
    if(val == Infinity)
        return 0;
    if(!val)
        return 0;
    return val;
}
function rentBurdenLessThan10(tract){
    return rentBurden(tract,'Less than 10 percent');
}
function rentBurden10to14(tract){
    return rentBurden(tract,'10 to 14 percent');
}
function rentBurden15to19(tract){
    return rentBurden(tract,'15 to 19 percent');
}
function rentBurden20to24(tract){
    return rentBurden(tract,'20 to 24 percent');
}
function rentBurden25to29(tract){
    return rentBurden(tract,'25 to 29 percent');
}
function rentBurden30to34(tract){
    return rentBurden(tract,'30 to 34 percent');
}
function rentBurden35to39(tract){
    return rentBurden(tract,'35 to 39 percent');
}
function rentBurden40to49(tract){
    return rentBurden(tract,'40 to 49 percent');
}
function rentBurden50orMore(tract){
    return rentBurden(tract,'50 percent or more');
}

class DemographicVis{
    constructor(title,description,data){
        this.title = title;
        this.description = description;
        this.demographicFunction = data;
    }
    setActive(index,ff){
        ff.chartTitle.html(this.title);
        ff.chartEquation.html(this.chartEquation);
        ff.presetIndex = index;
        ff.calculateAttractors(NUMBER_OF_ATTRACTORS,this.demographicFunction);
        ff.updateFlow();
    }
}

class Preset{
    constructor(title,chartEquation,aPoints,rPoints){
        this.title = title;
        this.chartEquation = chartEquation;
        this.attractors = aPoints;
        this.repulsors = rPoints;
    }
}

function createPresets(){
    //Preset color/flows
    whiteProportionComparisonPreset = new DemographicVis("Change In Proportion of White Population", "P<sub>White 2000</sub> / P<sub>Total 2000</sub> - P<sub>White 2020</sub> / P<sub>Total 2020</sub>",proportionalWhiteChange);
    blackProportionComparisonPreset = new DemographicVis("Change In Proportion of Black Population","P<sub>Black 2000</sub> / P<sub>Total 2000</sub> - P<sub>Black 2020</sub> / P<sub>Total 2020</sub>",proportionalBlackChange);
    asianProportionComparisonPreset = new DemographicVis("Change In Proportion of Asian Population","P<sub>Asian 2000</sub> / P<sub>Total 2000</sub> - P<sub>Asian 2020</sub> / P<sub>Total 2020</sub>",proportionalAsianChange);
    hispOrLatinoProportionComparisonPreset = new DemographicVis("Change In Proportion of Hispanic or Latino Population","P<sub>Hisp. or Latino 2000</sub> / P<sub>Total 2000</sub> - P<sub>Hisp. or Latino 2020</sub> / P<sub>Total 2020</sub>",proportionalHispOrLatinoChange);

    whiteComparisonPreset = new DemographicVis("Change in White Population","P<sub>White 2020</sub> - P<sub>White 2000</sub>",whitePeopleChange);
    blackComparisonPreset = new DemographicVis("Change in Black Population","P<sub>Black 2020</sub> - P<sub>Black 2000</sub>",blackPeopleChange);
    asianComparisonPreset = new DemographicVis("Change in Asian Population","P<sub>Asian 2020</sub> - P<sub>Asian 2000</sub>",asianPeopleChange);
    hispOrLatinoComparisonPreset = new DemographicVis("Change in Hispanic or Latino Population","P<sub>Hisp. or Latino 2020</sub> - P<sub>Hisp. or Latino 2000</sub>",hispanicOrLatinoPeopleChange);

    rentBurden1 = new DemographicVis("Change in Renters spending less than 10% of monthly income","",rentBurdenLessThan10);
    rentBurden2 = new DemographicVis("Change in Renters spending 10-14% of monthly income","",rentBurden10to14);
    rentBurden3 = new DemographicVis("Change in Renters spending 15-19% of monthly income","",rentBurden15to19);
    rentBurden4 = new DemographicVis("Change in Renters spending 20-24% of monthly income","",rentBurden20to24);
    rentBurden5 = new DemographicVis("Change in Renters spending 25-29% of monthly income","",rentBurden25to29);
    rentBurden6 = new DemographicVis("Change in Renters spending 30-34% of monthly income","",rentBurden30to34);
    rentBurden7 = new DemographicVis("Change in Renters spending 35-39% of monthly income","",rentBurden35to39);
    rentBurden8 = new DemographicVis("Change in Renters spending 40-49% of monthly income","",rentBurden40to49);
    rentBurden9 = new DemographicVis("Change in Renters spending more than 50% of monthly income","",rentBurden50orMore);

    presets = [
        whiteProportionComparisonPreset,
        blackProportionComparisonPreset,
        asianProportionComparisonPreset,
        hispOrLatinoProportionComparisonPreset,
        whiteComparisonPreset,
        blackComparisonPreset,
        asianComparisonPreset,
        hispOrLatinoComparisonPreset,
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
}
function createPremadePresets(){
  //Preset color/flows
  whiteProportionComparisonPreset = new Preset("Change In Proportion of White Population", "P<sub>White 2000</sub> / P<sub>Total 2000</sub> - P<sub>White 2020</sub> / P<sub>Total 2020</sub>",preset0Attractors,preset0Repulsors);
  blackProportionComparisonPreset = new Preset("Change In Proportion of Black Population","P<sub>Black 2000</sub> / P<sub>Total 2000</sub> - P<sub>Black 2020</sub> / P<sub>Total 2020</sub>",preset1Attractors,preset1Repulsors);
  asianProportionComparisonPreset = new Preset("Change In Proportion of Asian Population","P<sub>Asian 2000</sub> / P<sub>Total 2000</sub> - P<sub>Asian 2020</sub> / P<sub>Total 2020</sub>",preset2Attractors,preset2Repulsors);
  hispOrLatinoProportionComparisonPreset = new Preset("Change In Proportion of Hispanic or Latino Population","P<sub>Hisp. or Latino 2000</sub> / P<sub>Total 2000</sub> - P<sub>Hisp. or Latino 2020</sub> / P<sub>Total 2020</sub>",preset3Attractors,preset3Repulsors);

  whiteComparisonPreset = new Preset("Change in White Population","P<sub>White 2020</sub> - P<sub>White 2000</sub>",preset4Attractors,preset4Repulsors);
  blackComparisonPreset = new Preset("Change in Black Population","P<sub>Black 2020</sub> - P<sub>Black 2000</sub>",preset5Attractors,preset5Repulsors);
  asianComparisonPreset = new Preset("Change in Asian Population","P<sub>Asian 2020</sub> - P<sub>Asian 2000</sub>",preset6Attractors,preset6Repulsors);
  hispOrLatinoComparisonPreset = new Preset("Change in Hispanic or Latino Population","P<sub>Hisp. or Latino 2020</sub> - P<sub>Hisp. or Latino 2000</sub>",preset7Attractors,preset7Repulsors);

  rentBurden1 = new Preset("Change in Renters spending less than 10% of monthly income","",preset8Attractors,preset8Repulsors);
  rentBurden2 = new Preset("Change in Renters spending 10-14% of monthly income","",preset9Attractors,preset9Repulsors);
  rentBurden3 = new Preset("Change in Renters spending 15-19% of monthly income","",preset10Attractors,preset10Repulsors);
  rentBurden4 = new Preset("Change in Renters spending 20-24% of monthly income","",preset11Attractors,preset11Repulsors);
  rentBurden5 = new Preset("Change in Renters spending 25-29% of monthly income","",preset12Attractors,preset12Repulsors);
  rentBurden6 = new Preset("Change in Renters spending 30-34% of monthly income","",preset13Attractors,preset13Repulsors);
  rentBurden7 = new Preset("Change in Renters spending 35-39% of monthly income","",preset14Attractors,preset14Repulsors);
  rentBurden8 = new Preset("Change in Renters spending 40-49% of monthly income","",preset15Attractors,preset15Repulsors);
  rentBurden9 = new Preset("Change in Renters spending more than 50% of monthly income","",preset16Attractors,preset16Repulsors);

  presets = [
      whiteProportionComparisonPreset,
      blackProportionComparisonPreset,
      asianProportionComparisonPreset,
      hispOrLatinoProportionComparisonPreset,
      whiteComparisonPreset,
      blackComparisonPreset,
      asianComparisonPreset,
      hispOrLatinoComparisonPreset,
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
}

function getTopNTracts(n,func){
    let vals = bayTracts.toSorted((a,b) => {
        if(!a.hasData || a.raceData2020 == undefined || a.raceData2000 == undefined || a.rentData2000 == undefined || a.rentData2020 == undefined){
            return 0;
        }
        else if(!b.hasData || b.raceData2020 == undefined || b.raceData2000 == undefined || b.rentData2000 == undefined || b.rentData2020 == undefined){
            return 0;
        }
        let A = func(a);
        let B = func(b);

        if(A>B)
            return -1;
        else if(B>A)
            return 1;
        else
            return 0;
    });
    return vals.slice(0,n);
}

function getBottomNTracts(n,func){
    let vals = bayTracts.toSorted((a,b) => {
    if(!a.hasData || a.raceData2020 == undefined || a.raceData2000 == undefined){
            return 0;
        }
        else if(!b.hasData || b.raceData2020 == undefined || b.raceData2000 == undefined){
            return 0;
        }

        let A = func(a);
        let B = func(b);

        if(A>B)
            return -1;
        else if(B>A)
            return 1;
        else
            return 0;
    });
    //be careful to skip the tracts that don't have data, which will be at the bottom
    for(let i = vals.length-1; i>=0; i--){
        if(vals[i].hasData){
            return vals.slice((i-n),i);
        }
    }
}

function getSignificantPoints(n,func){
    let tracts = getTopNTracts(n,func);
    let points = [];
    for(let i = 0; i<min(n,tracts.length); i++){
        let point = {
            // x:((tracts[i].centroid.x+geoOffset.x)*scale.x)/width+0.5,
            // y:((tracts[i].centroid.y+geoOffset.y)*scale.y)/height+0.5,
            x:((tracts[i].centroid.x+geoOffset.x)),
            y:((tracts[i].centroid.y+geoOffset.y)),
            strength:func(tracts[i]),
            tractName:tracts[i].properties.NAMELSAD
        }
        points.push(point);
    }
    return points;
}

function getLeastSignificantPoints(n,func){
    let tracts = getBottomNTracts(n,func);
    let points = [];
    for(let i = 0; i<n; i++){
        let point = {
            // x:((tracts[i].centroid.x+geoOffset.x)*scale.x)/width+0.5,
            // y:((tracts[i].centroid.y+geoOffset.y)*scale.y)/height+0.5,
            x:((tracts[i].centroid.x+geoOffset.x)),
            y:((tracts[i].centroid.y+geoOffset.y)),
            strength:func(tracts[i])
        }
        points.push(point);
    }
    return points;
}

function getTotalStats(){
    totalStats = {'2000':{total:0,
                          white:0,
                          black:0,
                          asian:0},
                  '2020':{total:0,
                          white:0,
                          black:0,
                          asian:0}};

    for(let tract of bayTracts){
        if(!tract.hasData)
            continue;
        totalStats[2000].white += tract.raceData2000.obj['White'];
        totalStats[2020].white += tract.raceData2020.obj['White'];

        totalStats[2000].black += tract.raceData2000.obj['Black'];
        totalStats[2020].black += tract.raceData2020.obj['Black'];

        totalStats[2000].asian += tract.raceData2000.obj['Asian'];
        totalStats[2020].asian += tract.raceData2020.obj['Asian'];

        totalStats[2000].total += tract.raceData2000.obj['Total'];
        totalStats[2020].total += tract.raceData2020.obj['Total'];
    }
}