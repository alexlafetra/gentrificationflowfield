function loadCensusCSVData(){
    tractGeometry = loadJSON("data/geographic/CA_Tracts.geojson");
    oakHolcTracts = loadJSON("data/geographic/oakland_HOLC.json");
    sfHolcTracts = loadJSON("data/geographic/SF_HOLC.json");
    sjHolcTracts = loadJSON("data/geographic/SJ_HOLC.json");

    // raceData2000 = loadTable('data/Census/CONVERTED_Tracts_by_Race_2000.csv','csv','header');
    raceData2000 = loadTable('data/Census/Tracts_by_Race_2000.csv','csv','header');
    raceData2020 = loadTable('data/Census/Tracts_by_Race_2020.csv','csv','header');

    // rentData2000 = loadTable('data/Census/CONVERTED_Tracts_by_Rent_2000.csv','csv','header');
    rentData2000 = loadTable('data/Census/Tracts_by_Rent_2000.csv','csv','header');
    rentData2020 = loadTable('data/Census/Tracts_by_Rent_2020.csv','csv','header');

    //These vv turned out to be unhelpful! They're not complete, idk what counts as "substantially changed" but it's not enough
    // substantiallyChanged2000 = loadTable('data/Census/Substantially_Changed_2000.csv');
    // substantiallyChanged2010 = loadTable('data/Census/Substantially_Changed_2010.csv');
    conversions2000to2010 = loadTable('data/Census/2010_to_2000.csv','csv','header');
    conversions2010to2020 = loadTable('data/Census/2020_to_2010.csv','csv','header');
}

function cleanCensusData(){
    //parsing tract/county codes into 'Tract' and 'County' columns respectively
    getTractAndCountyCodes(raceData2000);
    getTractAndCountyCodes(raceData2020);
    getTractAndCountyCodes(rentData2000);
    getTractAndCountyCodes(rentData2020);

    //filtering data so it's faster to process
    raceData2000 = filterNonBayAreaCounties(raceData2000);
    raceData2020 = filterNonBayAreaCounties(raceData2020);
    rentData2000 = filterNonBayAreaCounties(rentData2000);
    rentData2020 = filterNonBayAreaCounties(rentData2020);

    //Converting 2000's data into 2020 data
    raceData2000 = convertTracts(raceData2000,conversions2000to2010,'GEOID00','GEOID10','2000',true);//GEOID's are stored under this name
    raceData2000 = convertTracts(raceData2000,conversions2010to2020,'GEOID_TRACT_10','GEOID_TRACT_20','Converted 2010',true);//GEOID's are stored in column 8, here (0 indexed)
    rentData2000 = convertTracts(rentData2000,conversions2000to2010,'GEOID00','GEOID10','2000',true);//GEOID's are stored under this name
    rentData2000 = convertTracts(rentData2000,conversions2010to2020,'GEOID_TRACT_10','GEOID_TRACT_20','Converted 2010',true);//GEOID's are stored under this name
}

/*
This is an okay way of doing tract conversions for preliminary exploration, but eventually you should make this a lot better.
Ideas for better:
store tract data as new object data, like "equivalent2010Data:[tract:001,pop:0001]"
then, after all the tracts are processed, decide how to compare these data to the 2020 data
*/
function convertTracts(dataIn,conversionSheet,oldGeoIDColumnName,newGeoIDColumnName,whichYear,silently){
    //New array of p5.TableRow objects to store the data in
    let convertedData = new p5.Table();
    convertedData.columns = dataIn.columns;
    // convertedData.clearRows();
    //iterate over every row in the dataset
    for(let i = 0; i<min(dataIn.getRowCount(),1000000000); i++){
        let originalTract = dataIn.getRow(i);

        //get the full GEOID
        let idToConvert = originalTract.get('GEOID').slice(-11);
        //get 6 digit ID
        let tractID = idToConvert.slice(-6);

        //get each instance of the geoid occuring in the conversion sheet
        let equivalents = conversionSheet.findRows(idToConvert,oldGeoIDColumnName);
        let numberOfEquivalents = equivalents.length;

        if(!silently){
            console.log("converting tract "+idToConvert+":");
            console.log(originalTract)
            console.log("Into "+numberOfEquivalents+" new tracts.");
        }

        //if there are no equivalents, then you don't need to convert it
        if(numberOfEquivalents == 0){
            //so just add the row to the new data
            convertedData.addRow(originalTract);
            continue;
        }

        //creating the new data (or adding to existing data)
        for(let equivalentIndex = 0; equivalentIndex<numberOfEquivalents; equivalentIndex++){
            let newGeoID = equivalents[equivalentIndex].get(newGeoIDColumnName);
            if(!silently){
                console.log("conversion #"+equivalentIndex+":");
                console.log(tractID+"-->"+newGeoID);
            }
            //Check and see if a tract has already been created in the new data with this geoid
            let newTract = convertedData.findRow(newGeoID.slice(-6),'Tract');
            //if you find one that already exists
            if(newTract){
                if(!silently){
                    console.log("A tract has already been converted to a tract with this new GeoID. Adding weighted data to it...");
                    console.log("start:");
                    console.log(newTract.get('Total'));
                }
                
                //Add the weighted data to it
                for(let j = 0; j<dataIn.getColumnCount(); j++){
                    let newValue = parseFloat(newTract.get(j))+parseFloat(originalTract.get(j))/numberOfEquivalents;
                    newTract.set(j,newValue);
                }
            }
            //if the new tract hasn't already been created, make one
            else{
                newTract = convertedData.addRow();
                if(!silently){
                    console.log("Creating a new tract...");
                    console.log("start:");
                    console.log(newTract.get('Total'));
                }
                //copy in each data point, and weight it
                for(let j = 0; j<dataIn.getColumnCount(); j++){
                    let newValue = parseFloat(originalTract.get(j))/numberOfEquivalents;
                    newTract.set(j,newValue);
                }
            }
            newTract.set('GEOID','1400000US'+newGeoID);
            newTract.set('Label for GEO_ID',"Census Tract "+newGeoID.slice(-6));
            newTract.set('County',newGeoID.slice(-9,-6));
            newTract.set('Tract',newGeoID.slice(-6));

            newTract.convertedFrom = whichYear;
            //make sure to put the newly added-to tract back into the array
            convertedData.addRow(newTract);
            
            if(!silently){
                console.log("end:");
                console.log(newTract.get('Total'));
            }
        }
    }
    return convertedData;
}