function whitePeopleComparedTo2000(tract){
    return tract.raceData2020.obj.White/tract.raceData2000.obj.White;
}
function blackPeopleComparedTo2000(tract){
    if(tract.raceData2000 == undefined || tract.raceData2020 == undefined)
        return 0;
    return tract.raceData2020.obj.Black/tract.raceData2000.obj.Black;
}
function asianPeopleComparedTo2000(tract){
    return tract.raceData2020.obj.Asian/tract.raceData2000.obj.Asian;
}

function whitePeopleChange(tract){
    return tract.raceData2020.obj.White - tract.raceData2000.obj.White;
}
function blackPeopleChange(tract){
    if(tract.raceData2000 == undefined || tract.raceData2020 == undefined)
        return 0;
    return tract.raceData2020.obj.Black - tract.raceData2000.obj.Black;
}
function asianPeopleChange(tract){
    return tract.raceData2020.obj.Asian - tract.raceData2000.obj.Asian;
}

function proportionalWhiteChange(tract){
    return (tract.raceData2020.obj.White/tract.raceData2020.obj.Total) - (tract.raceData2000.obj.White/tract.raceData2000.obj.Total);
}
function proportionalBlackChange(tract){
    if(tract.raceData2000 == undefined || tract.raceData2020 == undefined)
        return 0;
    let val = (tract.raceData2020.obj.Black/tract.raceData2020.obj.Total) - (tract.raceData2000.obj.Black/tract.raceData2000.obj.Total);
    return val;
}
function proportionalAsianChange(tract){
    return (tract.raceData2020.obj.Asian/tract.raceData2020.obj.Total) - (tract.raceData2000.obj.Asian/tract.raceData2000.obj.Total);
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

function highRentBurden(tract){
    if(tract.rentData2000 == undefined || tract.rentData2020 == undefined){
        return 0;
    }
    // console.log(tract);
    // tract.hasData = true;
    // return tract.rentData2020.obj[0]/tract.rentData2000.obj[0];
    // console.log(tract.rentData2020.obj['10 to 14 percent']);
    return tract.rentData2020.obj['10 to 14 percent']/tract.rentData2000.obj['10 to 14 percent'];
}

function getTopNTracts(n,func){
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
            x:((tracts[i].centroid.x+geoOffset.x)*scale.x+offset.x)/width+0.5,
            y:((tracts[i].centroid.y+geoOffset.y)*scale.y+offset.y)/height+0.5,
            strength:func(tracts[i])
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
            x:((tracts[i].centroid.x+geoOffset.x)*scale.x+offset.x)/width+0.5,
            y:((tracts[i].centroid.y+geoOffset.y)*scale.y+offset.y)/height+0.5,
            strength:func(tracts[i])
        }
        points.push(point);
    }
    return points;
}
