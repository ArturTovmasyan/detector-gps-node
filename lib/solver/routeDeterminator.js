var loader            = require("./dataResponsible");
var solver_conf       = require('../../config/parameters').solver;


var routeSectionOrder = {};

/*********************************************************************************************
 routeSectionOrder: structure

 {
    1234567890: {
        1: { orderSequence: [215, 216, 218, 219], lastInserted: '2015-03-05 12:52:15' },
        2: { orderSequence: [125, 124, 123, 121], lastInserted: '2015-03-05 12:53:29' },
        onSameSectionCount: 2,
        lastRouteId: 1,
        offLineDataCount: 0
    },
    1234567890: {
        3: { orderSequence: [205, 206, 208, 209], lastInserted: '2015-03-05 12:48:13' },
        5: { orderSequence: [25, 24, 21, 18],     lastInserted: '2015-03-05 12:49:17' },
        onSameSectionCount: 1,
        lastRouteId: 3,
        offLineDataCount: 1
    },
 }

***********************************************************************************************/

/**
 * @param imei
 * @param currentSectionId
 * @returns {number}
 */
function determineRoute(imei, currentSectionId)
{
    var line_number = loader.findLineByImei(imei);
    var routes      = loader.findLineRoutes(line_number);

    collectBusPlaces(imei, currentSectionId);

    if (!currentSectionId){
        if (routeSectionOrder[imei]['offLineDataCount'] <= solver_conf.OFF_LINE_DATA_COUNT_TO_CHANGE_STATUS){
            return routeSectionOrder[imei]['lastRouteId'];
        }
        else {
            routeSectionOrder[imei] = null;
            return null;
        }
    }

    var currentRouteId = 0;
    var lastInserted   = null;

    for (var key in routes)
    {
        var route = routes[key];
        if (currentSectionId >= (route.route_section_max_order - solver_conf.LAST_SECTIONS_COUNT) && routeSectionOrder[imei]['onSameSectionCount'] >= solver_conf.MAX_STAY_COUNT_ON_LAST_SECTIONS){
            routeSectionOrder[imei] = null;
            return null;
        }
        else {
            if (routeSectionOrder[imei][route.id] && isApproximatelyRising(routeSectionOrder[imei][route.id]['orderSequence'])
                && (!lastInserted || lastInserted < routeSectionOrder[imei][route.id]['lastInserted'])) {
                currentRouteId = route.id;
                lastInserted = routeSectionOrder[imei][route.id]['lastInserted'];
            }
        }
    }

    if (currentRouteId) {
        routeSectionOrder[imei]['lastRouteId'] = currentRouteId;
        return currentRouteId;
    }

    return null;
}


/**
 * @param imei
 * @param currentSectionId
 */
function collectBusPlaces(imei, currentSectionId)
{
    if (!routeSectionOrder[imei]) {
        routeSectionOrder[imei] = {offLineDataCount: 0, onSameSectionCount: 0};
    }

    if (!currentSectionId){
        routeSectionOrder[imei]['offLineDataCount']++;
        return;
    }
    else {
        routeSectionOrder[imei]['offLineDataCount'] = 0;
    }

    var line_number = loader.findLineByImei(imei);
    var sections    = loader.findSectionsByLine(line_number);

    sections[currentSectionId].route_section.forEach(function (routeSection) {

        if (!routeSectionOrder[imei][routeSection.route.id]) {
            routeSectionOrder[imei][routeSection.route.id] = {orderSequence: []};
        }

        if (routeSectionOrder[imei][routeSection.route.id]['orderSequence'].indexOf(routeSection.order) == -1) {
            routeSectionOrder[imei][routeSection.route.id]['orderSequence'].push(routeSection.order);
            routeSectionOrder[imei]['onSameSectionCount'] = 1;
        }
        else {
            routeSectionOrder[imei]['onSameSectionCount']++;
        }

        //Change lastInserted date to know last incoming valid data date
        routeSectionOrder[imei][routeSection.route.id]['lastInserted'] = new Date();

        if (routeSectionOrder[imei][routeSection.route.id]['orderSequence'].length > solver_conf.COLLECT_COUNT_FOR_ROUTE) {
            routeSectionOrder[imei][routeSection.route.id]['orderSequence'].shift();
        }
    });
}

/**
 *
 * @param arr
 * @returns {boolean}
 */
function isApproximatelyRising(arr)
{
    if (arr.length < 3){
        return false;
    }

    var isGreat = 0;
    for (var i = 0; i < arr.length - 1; i++) {
        if (arr[i] < arr[i + 1]) {
            isGreat++;
        }
    }

    return (isGreat/(arr.length - 1) > 0.7);
}


module.exports.determineRoute = determineRoute;