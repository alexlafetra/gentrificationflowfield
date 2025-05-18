//Storing some overall totals in the "totalStats" object
let totalStats;

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
    const allOtherGroupsExceptWhiteProportionComparisonPreset = new DemographicVis("","",proportionalNonWhiteChange);
    const whiteProportionComparisonPreset = new DemographicVis("Change In Proportion of White Population", "P<sub>White 2000</sub> / P<sub>Total 2000</sub> - P<sub>White 2020</sub> / P<sub>Total 2020</sub>",proportionalWhiteChange);
    const blackProportionComparisonPreset = new DemographicVis("Change In Proportion of Black Population","P<sub>Black 2000</sub> / P<sub>Total 2000</sub> - P<sub>Black 2020</sub> / P<sub>Total 2020</sub>",proportionalBlackChange);
    const asianProportionComparisonPreset = new DemographicVis("Change In Proportion of Asian Population","P<sub>Asian 2000</sub> / P<sub>Total 2000</sub> - P<sub>Asian 2020</sub> / P<sub>Total 2020</sub>",proportionalAsianChange);
    const hispOrLatinoProportionComparisonPreset = new DemographicVis("Change In Proportion of Hispanic or Latino Population","P<sub>Hisp. or Latino 2000</sub> / P<sub>Total 2000</sub> - P<sub>Hisp. or Latino 2020</sub> / P<sub>Total 2020</sub>",proportionalHispOrLatinoChange);
    const directPopChange = new DemographicVis("Direct Change in Total Population","Population<sub>2020</sub> - Population<sub>2000</sub>",directChangeInPopulation);

    const whiteComparisonPreset = new DemographicVis("Change in White Population","P<sub>White 2020</sub> - P<sub>White 2000</sub>",whitePeopleChange);
    const blackComparisonPreset = new DemographicVis("Change in Black Population","P<sub>Black 2020</sub> - P<sub>Black 2000</sub>",blackPeopleChange);
    const asianComparisonPreset = new DemographicVis("Change in Asian Population","P<sub>Asian 2020</sub> - P<sub>Asian 2000</sub>",asianPeopleChange);
    const hispOrLatinoComparisonPreset = new DemographicVis("Change in Hispanic or Latino Population","P<sub>Hisp. or Latino 2020</sub> - P<sub>Hisp. or Latino 2000</sub>",hispanicOrLatinoPeopleChange);

    const medianRentChangePreset = new DemographicVis("Change in Median Rent","Rent<sub>2020</sub> - Rent<sub>2000</sub>",medianRentChange);

    const rentBurden1 = new DemographicVis("Change in Renters spending less than 10% of monthly income","",rentBurdenLessThan10);
    const rentBurden2 = new DemographicVis("Change in Renters spending 10-14% of monthly income","",rentBurden10to14);
    const rentBurden3 = new DemographicVis("Change in renters spending 15-19% of monthly income","", rentBurden15to19);
    const rentBurden4 = new DemographicVis("Change in renters spending 20-24% of monthly income","", rentBurden20to24);
    const rentBurden5 = new DemographicVis("Change in renters spending 25-29% of monthly income","", rentBurden25to29);
    const rentBurden6 = new DemographicVis("Change in renters spending 30-34% of monthly income","", rentBurden30to34);
    const rentBurden7 = new DemographicVis("Change in renters spending 35-39% of monthly income","", rentBurden35to39);
    const rentBurden8 = new DemographicVis("Change in renters spending 40-49% of monthly income","", rentBurden40to49);

    const rentBurdenMoreThan50 = new DemographicVis("Direct Change in renters spending more than 50% of monthly income","", rentBurden50orMore_direct);
    const rentBurdenLessThan25 = new DemographicVis("Direct Change in renters spending less than 25% of monthly income on rent","", rentBurdenLessThan25Stat_direct);
    const rentBurdenLessThan50 = new DemographicVis("Direct Change in renters spending 25%-50% of monthly income on rent","", rentBurden25to50_direct);

    const rentBurdenPresetLessThan25_relative = new DemographicVis("Relative Change in renters spending less than 25% of monthly income on rent","", rentBurdenLessThan25Stat_relative);
    const rentBurdenPreset25to50_relative = new DemographicVis("Relative Change in renters spending 25%-50% of monthly income on rent","", rentBurden25to50_relative);
    const rentBurdenPresetMoreThan50_relative = new DemographicVis("Relative Change in renters spending more than 50% of monthly income","", rentBurden50orMore_relative);

    censusDataPresets = [
        whiteProportionComparisonPreset,
        blackProportionComparisonPreset,
        asianProportionComparisonPreset,
        hispOrLatinoProportionComparisonPreset,
        allOtherGroupsExceptWhiteProportionComparisonPreset,
        whiteComparisonPreset,
        blackComparisonPreset,
        asianComparisonPreset,
        hispOrLatinoComparisonPreset,
        medianRentChangePreset,
        rentBurden1,
        rentBurden2,
        rentBurden3,
        rentBurden4,
        rentBurden5,
        rentBurden6,
        rentBurden7,
        rentBurden8,
        rentBurdenMoreThan50,
        rentBurdenLessThan25,
        rentBurdenLessThan50,
        directPopChange,
        rentBurdenPresetLessThan25_relative,
        rentBurdenPreset25to50_relative,
        rentBurdenPresetMoreThan50_relative
    ];
}
function createPremadePresets(){
  //Preset color/flows
  whiteProportionComparisonPreset = new Preset("Relative Change in Pop of White Neighborhood Residents", "P<sub>White 2000</sub> / P<sub>Total 2000</sub> - P<sub>White 2020</sub> / P<sub>Total 2020</sub>",preset0Nodes);
  blackProportionComparisonPreset = new Preset("Relative Change in Pop of Black Neighborhood Residents","P<sub>Black 2000</sub> / P<sub>Total 2000</sub> - P<sub>Black 2020</sub> / P<sub>Total 2020</sub>",preset1Nodes);
  asianProportionComparisonPreset = new Preset("Relative Change in Pop of Asian Neighborhood Residents","P<sub>Asian 2000</sub> / P<sub>Total 2000</sub> - P<sub>Asian 2020</sub> / P<sub>Total 2020</sub>",preset2Nodes);
  hispOrLatinoProportionComparisonPreset = new Preset("Relative Change in Pop of Hispanic or Latino Neighborhood Residents","P<sub>Hisp. or Latino 2000</sub> / P<sub>Total 2000</sub> - P<sub>Hisp. or Latino 2020</sub> / P<sub>Total 2020</sub>",preset3Nodes);
  const everyoneButWhitePplPreset = new Preset("All groups except white people","",preset4Nodes);

  whiteComparisonPreset = new Preset("Direct Change in Population of White Neighborhood Residents","P<sub>White 2020</sub> - P<sub>White 2000</sub>",preset5Nodes);
  blackComparisonPreset = new Preset("Direct Change in Population of Black Neighborhood Residents","P<sub>Black 2020</sub> - P<sub>Black 2000</sub>",preset6Nodes);
  asianComparisonPreset = new Preset("Direct Change in Population of Asian Neighborhood Residents","P<sub>Asian 2020</sub> - P<sub>Asian 2000</sub>",preset7Nodes);
  hispOrLatinoComparisonPreset = new Preset("Direct Change in Population of Hispanic or Latino Neighborhood Residents","P<sub>Hisp. or Latino 2020</sub> - P<sub>Hisp. or Latino 2000</sub>",preset8Nodes);

  const medianRentChangePreset = new Preset("Change in Median Rent","Median Rent<sub>2020</sub> - Median Rent<sub>2000</sub>",preset9Nodes);

//   const rentBurden1 = new Preset("Change in Population of Renters Spending Less Than 10% of Monthly Income","",preset9Nodes);
//   const rentBurden2 = new Preset("Change in Population of Renters Spending 10-14% of Monthly Income","",preset10Nodes);
//   const rentBurden3 = new Preset("Change in Population of Renters Spending 15-19% of Monthly Income","",preset11Nodes);
//   const rentBurden4 = new Preset("Change in Population of Renters Spending 20-24% of Monthly Income","",preset12Nodes);
//   const rentBurden5 = new Preset("Change in Population of Renters Spending 25-29% of Monthly Income","",preset13Nodes);
//   const rentBurden6 = new Preset("Change in Population of Renters Spending 30-34% of Monthly Income","",preset14Nodes);
//   const rentBurden7 = new Preset("Change in Population of Renters Spending 35-39% of Monthly Income","",preset15Nodes);
//   const rentBurden8 = new Preset("Change in Population of Renters Spending 40-49% of Monthly Income","",preset16Nodes);
  const rentBurdenGreaterThan50 = new Preset("Direct Change in Population of Renters Spending More Than 50% of Monthly Income","P<sub>50-100% 2020</sub> - P<sub>50-100% 2000</sub>",preset18Nodes);
  const rentBurdenLessThan25 = new Preset("Direct Change in renters spending less than 25% of monthly income on rent","P<sub>0-25% 2020</sub> - P<sub>0-25% 2000</sub>", preset19Nodes);
  const rentBurdenLessThan50 = new Preset("Direct Change in renters spending 25%-50% of monthly income on rent","P<sub>25-50% 2020</sub> - P<sub>25-50% 2000</sub>", preset20Nodes);

  const directPopChange = new Preset("Direct Change in Total Population","Population<sub>2020</sub> - Population<sub>2000</sub>",preset21Nodes);

  //these are kinda busted
  const rentBurdenPresetLessThan25_relative = new Preset("Relative Change in renters spending less than 25% of monthly income on rent","", preset22Nodes);
  const rentBurdenPreset25to50_relative = new Preset("Relative Change in renters spending 25%-50% of monthly income on rent","", preset23Nodes);
  const rentBurdenPresetMoreThan50_relative = new Preset("Relative Change in renters spending more than 50% of monthly income","", preset24Nodes);


  censusDataPresets = [
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
    //   rentBurden1,
    //   rentBurden2,
    //   rentBurden3,
    //   rentBurden4,
    //   rentBurden5,
    //   rentBurden6,
    //   rentBurden7,
    //   rentBurden8,
    rentBurdenGreaterThan50,
    rentBurdenPresetLessThan25_relative,
    rentBurdenPreset25to50_relative,
    rentBurdenPresetMoreThan50_relative
  ];
}

//parses tracts into nodes
function createNodesFromTracts(fn){
    let nodes = [];
    for(tract of bayTracts){
        //skip tracts w/ missing data
        if(!tract.hasData){
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