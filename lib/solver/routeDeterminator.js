var loader            = require("./dataResponsible");
var solver_conf       = require('../../config/parameters').solver;


var routeSectionOrder = {};

/*********************************************************************************************
 routeSectionOrder: structure

 {
    1234567890: {
        1: { orderSequence: [215, 216, 218, 219], lastInserted: '2015-03-05 12:52:15' },
        2: { orderSequence: [125, 124, 123, 121], lastInserted: '2015-03-05 12:53:29' }
    },
    1234567890: {
        3: { orderSequence: [205, 206, 208, 209], lastInserted: '2015-03-05 12:48:13' },
        5: { orderSequence: [25, 24, 21, 18],     lastInserted: '2015-03-05 12:49:17' }
    },
 }

***********************************************************************************************/

/**
 * @param imei
 * @param currentSectionId
 * @returns {number}
 */
function determineRoute(imei, currentSectionId){

    collectBusPlaces(imei, currentSectionId);

    var line_number = loader.findLineByImei(imei);
    var route_ids   = loader.findLineRouteIds(line_number);

    console.log(route_ids);

    var currentRouteId = 0;
    var lastInserted   = null;

    route_ids.forEach(function (route_id) {
        if (isApproximatelyRising(routeSectionOrder[imei][route_id]['orderSequence']) && (!lastInserted || lastInserted < routeSectionOrder[imei][route_id]['lastInserted'])){
            currentRouteId = route_id;
            lastInserted   = routeSectionOrder[imei][route_id]['lastInserted'];
        }
    });

    if (currentRouteId) {
        return currentRouteId;
    }

    throw new Error("Can't determine route by current data!!!");
}


/**
 * @param imei
 * @param currentSectionId
 */
function collectBusPlaces(imei, currentSectionId)
{
    var line_number = loader.findLineByImei(imei);
    var sections    = loader.findSectionsByLine(line_number);


    if (!routeSectionOrder[imei]) {
        routeSectionOrder[imei] = {};
    }

    sections[currentSectionId].route_section.forEach(function (routeSection) {

        if (!Array.isArray( routeSectionOrder[imei][routeSection.route.id] )) {
            routeSectionOrder[imei][routeSection.route.id] = {orderSequence: []};
        }

        if (routeSectionOrder[imei][routeSection.route.id]['orderSequence'].indexOf(routeSection.order) == -1) {
            routeSectionOrder[imei][routeSection.route.id]['orderSequence'].push(routeSection.order);
            routeSectionOrder[imei][routeSection.route.id]['lastInserted'] = new Date();
        }

        if (routeSectionOrder[imei][routeSection.route.id]['orderSequence'].length > 10) {
            routeSectionOrder[imei][routeSection.route.id]['orderSequence'].shift();
        }
    });
}

/**
 *
 * @param arr
 * @returns {boolean}
 */
function isApproximatelyRising(arr){
    if (arr.length < 3){
        return false;
    }

    var isGreat = 0;

    for (var i = 0; i < arr.length - 1; i++) {
        if (arr[i] < arr[i + 1]) {
            isGreat++;
        }
    }

    return (isGreat/arr.length > 0.7);
}


module.exports.determineRoute = determineRoute;