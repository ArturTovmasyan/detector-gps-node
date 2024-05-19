/**
 * Created by andranik on 6/11/15.
 */

var loader      = require("../data-loader");

var busPositionsData = {};


function determineNearestBus(imei, routeId, sectionId){

    //Determine line number
    var line_number   = loader.findLineByImei(imei);

    if (!busPositionsData[line_number]){
        busPositionsData[line_number] = {};
    }

    if (routeId && !busPositionsData[line_number][routeId]){
        busPositionsData[line_number][routeId] = {};
    }


    //Determine section order in the route
    var sectionOrder = -1;
    var sections     = loader.findSectionsByLine(line_number);

    //Will use to remove bus data from previous route
    var otherRouteId = 0;

    sections[sectionId].route_section.forEach(function (routeSection){
        if (routeSection.route.id == routeId){
            sectionOrder = routeSection.order;
        }
        else {
            otherRouteId = routeSection.route.id;
        }
    });

    if (sectionOrder == -1){
        throw new Error("Can't find route with" + routeId + " id for given section with " + sectionId + " id");
    }

    if (!busPositionsData[line_number][routeId][imei]){
        if (busPositionsData[line_number][otherRouteId] && busPositionsData[line_number][otherRouteId][imei]){
            delete busPositionsData[line_number][otherRouteId][imei];
        }
    }

    busPositionsData[line_number][routeId][imei] = sectionOrder;

    var frontImei = 0;
    var backImei  = 0;

    for(var key in busPositionsData[line_number][routeId]){
        if ((!frontImei || busPositionsData[line_number][routeId][frontImei] > busPositionsData[line_number][routeId][key])
            && busPositionsData[line_number][routeId][imei] < busPositionsData[line_number][routeId][key]){
            frontImei = key;
        }
        if ((!backImei || busPositionsData[line_number][routeId][backImei] < busPositionsData[line_number][routeId][key])
            && busPositionsData[line_number][routeId][imei] > busPositionsData[line_number][routeId][key]){
            backImei = key;
        }
    }

    return {
        frontImei: frontImei,
        backImei:  backImei
    };
}

module.exports.determineNearestBus = determineNearestBus;