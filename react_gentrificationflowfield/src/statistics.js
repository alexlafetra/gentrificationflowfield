import presetNodeData from './presetData.js';

//Storing some overall totals in the "totalStats" object
let totalStats;
let censusDataPresets;

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

function directChangeInPopulation(tract){
    if(!tract.hasData)
        return 0;
    const val = (tract.raceData2020.obj.Total) - (tract.raceData2000.obj.Total);
    if(val == NaN)
        return 0;
    if(val == Infinity)
        return 0;
    if(!val)
        return 0;
    return val;
}
function proportionalNonWhiteChange(tract){
    if(tract.raceData2000 == undefined || tract.raceData2020 == undefined)
        return 0;
    const val = ((tract.raceData2020.obj.Total-tract.raceData2020.obj['White'])/tract.raceData2020.obj.Total) - ((tract.raceData2000.obj.Total-tract.raceData2000.obj['White'])/tract.raceData2000.obj.Total);
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
    if(tract.rentBurdenData2000 == undefined || tract.rentBurdenData2020 == undefined){
        return 0;
    }
    let val = tract.rentBurdenData2020.obj[field]-tract.rentBurdenData2000.obj[field];
    if(val == NaN)
        return 0;
    if(val == Infinity)
        return 0;
    if(!val)
        return 0;
    return val;
}

function rentBurden_relative(tract,field){
    if(tract.rentBurdenData2000 == undefined || tract.rentBurdenData2020 == undefined){
        return 0;
    }
    let val = tract.rentBurdenData2020.obj[field]/tract.raceData2020.obj.Total-tract.rentBurdenData2000.obj[field]/tract.raceData2000.obj.Total;
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
function rentBurden50orMore_direct(tract){
    return rentBurden(tract,'50 percent or more');
}
function rentBurdenLessThan25Stat_direct(tract){
    return rentBurden(tract,'Less than 10 percent')+rentBurden(tract,'10 to 14 percent')+rentBurden(tract,'15 to 19 percent')+rentBurden(tract,'20 to 24 percent');
}
function rentBurden25to50_direct(tract){
    return rentBurden(tract,'25 to 29 percent')+rentBurden(tract,'30 to 34 percent')+rentBurden(tract,'35 to 39 percent')+rentBurden(tract,'40 to 49 percent');
}

function rentBurden50orMore_relative(tract){
    return rentBurden_relative(tract,'50 percent or more');
}
function rentBurdenLessThan25Stat_relative(tract){
    return rentBurden_relative(tract,'Less than 10 percent')+rentBurden_relative(tract,'10 to 14 percent')+rentBurden_relative(tract,'15 to 19 percent')+rentBurden_relative(tract,'20 to 24 percent');

}
function rentBurden25to50_relative(tract){
    return rentBurden_relative(tract,'25 to 29 percent')+rentBurden_relative(tract,'30 to 34 percent')+rentBurden_relative(tract,'35 to 39 percent')+rentBurden_relative(tract,'40 to 49 percent');
}

function medianRentChange(tract){
    if(!tract.hasData)
        return 0;
    const val = tract.medianRentData2020.obj['Median_Rent'] - tract.medianRentData2000.obj['Median_Rent'];
    if(val == NaN)
        return 0;
    if(val == Infinity)
        return 0;
    if(!val)
        return 0;
    return val;
}
function medianRentRatio(tract){
    if(!tract.hasData)
        return 0;
    let val = tract.medianRentData2020.obj['Median_Rent']/tract.medianRentData2000.obj['Median_Rent'];
    val = map(val,0,1,-10,10);
    if(val == NaN)
        return 0;
    if(val == Infinity)
        return 0;
    if(!val)
        return 0;
    return val;
}

class DemographicVis{
    constructor(title,description,data){
        this.title = title;
        this.chartEquation = description;
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
  const whiteProportionComparisonPreset = new Preset("Relative Change in Pop of White Neighborhood Residents", "P<sub>White 2000</sub> / P<sub>Total 2000</sub> - P<sub>White 2020</sub> / P<sub>Total 2020</sub>",presetNodeData[0]);
  const blackProportionComparisonPreset = new Preset("Relative Change in Pop of Black Neighborhood Residents","P<sub>Black 2000</sub> / P<sub>Total 2000</sub> - P<sub>Black 2020</sub> / P<sub>Total 2020</sub>",presetNodeData[1]);
  const asianProportionComparisonPreset = new Preset("Relative Change in Pop of Asian Neighborhood Residents","P<sub>Asian 2000</sub> / P<sub>Total 2000</sub> - P<sub>Asian 2020</sub> / P<sub>Total 2020</sub>",presetNodeData[2]);
  const hispOrLatinoProportionComparisonPreset = new Preset("Relative Change in Pop of Hispanic or Latino Neighborhood Residents","P<sub>Hisp. or Latino 2000</sub> / P<sub>Total 2000</sub> - P<sub>Hisp. or Latino 2020</sub> / P<sub>Total 2020</sub>",presetNodeData[3]);
  const everyoneButWhitePplPreset = new Preset("All groups except white people","",presetNodeData[4]);

  const whiteComparisonPreset = new Preset("Direct Change in Population of White Neighborhood Residents","P<sub>White 2020</sub> - P<sub>White 2000</sub>",presetNodeData[5]);
  const blackComparisonPreset = new Preset("Direct Change in Population of Black Neighborhood Residents","P<sub>Black 2020</sub> - P<sub>Black 2000</sub>",presetNodeData[6]);
  const asianComparisonPreset = new Preset("Direct Change in Population of Asian Neighborhood Residents","P<sub>Asian 2020</sub> - P<sub>Asian 2000</sub>",presetNodeData[7]);
  const hispOrLatinoComparisonPreset = new Preset("Direct Change in Population of Hispanic or Latino Neighborhood Residents","P<sub>Hisp. or Latino 2020</sub> - P<sub>Hisp. or Latino 2000</sub>",presetNodeData[8]);

  const medianRentChangePreset = new Preset("Change in Median Rent","Median Rent<sub>2020</sub> - Median Rent<sub>2000</sub>",presetNodeData[9]);

//   const rentBurden1 = new Preset("Change in Population of Renters Spending Less Than 10% of Monthly Income","",preset9Nodes);
//   const rentBurden2 = new Preset("Change in Population of Renters Spending 10-14% of Monthly Income","",preset10Nodes);
//   const rentBurden3 = new Preset("Change in Population of Renters Spending 15-19% of Monthly Income","",preset11Nodes);
//   const rentBurden4 = new Preset("Change in Population of Renters Spending 20-24% of Monthly Income","",preset12Nodes);
//   const rentBurden5 = new Preset("Change in Population of Renters Spending 25-29% of Monthly Income","",preset13Nodes);
//   const rentBurden6 = new Preset("Change in Population of Renters Spending 30-34% of Monthly Income","",preset14Nodes);
//   const rentBurden7 = new Preset("Change in Population of Renters Spending 35-39% of Monthly Income","",preset15Nodes);
//   const rentBurden8 = new Preset("Change in Population of Renters Spending 40-49% of Monthly Income","",preset16Nodes);

  const rentBurdenGreaterThan50 = new Preset("Direct Change in Population of Renters Spending More Than 50% of Monthly Income","P<sub>50-100% 2020</sub> - P<sub>50-100% 2000</sub>",presetNodeData[18]);
  const rentBurdenLessThan25 = new Preset("Direct Change in renters spending less than 25% of monthly income on rent","P<sub>0-25% 2020</sub> - P<sub>0-25% 2000</sub>", presetNodeData[19]);
  const rentBurdenLessThan50 = new Preset("Direct Change in renters spending 25%-50% of monthly income on rent","P<sub>25-50% 2020</sub> - P<sub>25-50% 2000</sub>", presetNodeData[20]);

  const directPopChange = new Preset("Direct Change in Total Population","Population<sub>2020</sub> - Population<sub>2000</sub>",presetNodeData[21]);

  //these are kinda busted
  const rentBurdenPresetLessThan25_relative = new Preset("Relative Change in renters spending less than 25% of monthly income on rent","", presetNodeData[22]);
  const rentBurdenPreset25to50_relative = new Preset("Relative Change in renters spending 25%-50% of monthly income on rent","", presetNodeData[23]);
  const rentBurdenPresetMoreThan50_relative = new Preset("Relative Change in renters spending more than 50% of monthly income","", presetNodeData[24]);


  return [
    whiteProportionComparisonPreset,
    blackProportionComparisonPreset,
    asianProportionComparisonPreset,
    hispOrLatinoProportionComparisonPreset,
    everyoneButWhitePplPreset,
    whiteComparisonPreset,
    blackComparisonPreset,
    asianComparisonPreset,
    hispOrLatinoComparisonPreset,
    directPopChange,
    medianRentChangePreset,
    rentBurdenLessThan25,
    rentBurdenLessThan50,
    rentBurdenGreaterThan50,
    rentBurdenPresetLessThan25_relative,
    rentBurdenPreset25to50_relative,
    rentBurdenPresetMoreThan50_relative
  ];
}

export default createPresets;