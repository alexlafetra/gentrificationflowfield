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
        ff.calculateNodes(NUMBER_OF_ATTRACTORS,this.demographicFunction);
        ff.updateFlow();
    }
}

class Preset{
    constructor(title,chartEquation,nodes){
        this.title = title;
        this.chartEquation = chartEquation;
        this.nodes = nodes;
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

    censusDataPresets = [
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
  whiteProportionComparisonPreset = new Preset("Change In Proportion of White Population", "P<sub>White 2000</sub> / P<sub>Total 2000</sub> - P<sub>White 2020</sub> / P<sub>Total 2020</sub>",preset0Nodes);
  blackProportionComparisonPreset = new Preset("Change In Proportion of Black Population","P<sub>Black 2000</sub> / P<sub>Total 2000</sub> - P<sub>Black 2020</sub> / P<sub>Total 2020</sub>",preset1Nodes);
  asianProportionComparisonPreset = new Preset("Change In Proportion of Asian Population","P<sub>Asian 2000</sub> / P<sub>Total 2000</sub> - P<sub>Asian 2020</sub> / P<sub>Total 2020</sub>",preset2Nodes);
  hispOrLatinoProportionComparisonPreset = new Preset("Change In Proportion of Hispanic or Latino Population","P<sub>Hisp. or Latino 2000</sub> / P<sub>Total 2000</sub> - P<sub>Hisp. or Latino 2020</sub> / P<sub>Total 2020</sub>",preset3Nodes);

  whiteComparisonPreset = new Preset("Change in White Population","P<sub>White 2020</sub> - P<sub>White 2000</sub>",preset4Nodes);
  blackComparisonPreset = new Preset("Change in Black Population","P<sub>Black 2020</sub> - P<sub>Black 2000</sub>",preset5Nodes);
  asianComparisonPreset = new Preset("Change in Asian Population","P<sub>Asian 2020</sub> - P<sub>Asian 2000</sub>",preset6Nodes);
  hispOrLatinoComparisonPreset = new Preset("Change in Hispanic or Latino Population","P<sub>Hisp. or Latino 2020</sub> - P<sub>Hisp. or Latino 2000</sub>",preset7Nodes);

  rentBurden1 = new Preset("Change in Renters spending less than 10% of monthly income","",preset8Nodes);
  rentBurden2 = new Preset("Change in Renters spending 10-14% of monthly income","",preset9Nodes);
  rentBurden3 = new Preset("Change in Renters spending 15-19% of monthly income","",preset10Nodes);
  rentBurden4 = new Preset("Change in Renters spending 20-24% of monthly income","",preset11Nodes);
  rentBurden5 = new Preset("Change in Renters spending 25-29% of monthly income","",preset12Nodes);
  rentBurden6 = new Preset("Change in Renters spending 30-34% of monthly income","",preset13Nodes);
  rentBurden7 = new Preset("Change in Renters spending 35-39% of monthly income","",preset14Nodes);
  rentBurden8 = new Preset("Change in Renters spending 40-49% of monthly income","",preset15Nodes);
  rentBurden9 = new Preset("Change in Renters spending more than 50% of monthly income","",preset16Nodes);

  censusDataPresets = [
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

//parses tracts into nodes
function createNodesFromTracts(fn){
    let nodes = [];
    for(tract of bayTracts){
        //skip tracts w/ missing data
        if(!tract.hasData || tract.raceData2020 == undefined || tract.raceData2000 == undefined || tract.rentData2000 == undefined || tract.rentData2020 == undefined){
            continue;
        }
        let node = {
            x:((tract.centroid.x+geoOffset.x)),
            y:((tract.centroid.y+geoOffset.y)),
            strength:fn(tract),
            tractName:tract.properties.NAMELSAD
        }
        //skip glitched/empty nodes
        if(node.strength == Infinity ||  node.strength == 0 && node.strength == undefined)
            continue;
        else
            nodes.push(node);
    }
    return nodes;
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