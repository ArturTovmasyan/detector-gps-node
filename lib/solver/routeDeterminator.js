var loader            = require("../data-loader");
var solver_conf       = require("../../config/parameters").solver;
var cache             = require("memory-cache");


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

    var routeSectionOrder = cache.get(imei);
    var sectionOrderInRoutes = collectBusPlaces(routeSectionOrder, imei, currentSectionId);
    console.log(routeSectionOrder);

    if (!currentSectionId){
        if (routeSectionOrder['offLineDataCount'] <= solver_conf.OFF_LINE_DATA_COUNT_TO_CHANGE_STATUS){
            return routeSectionOrder['lastRouteId'];
        }
        else {
            cache.del(imei);
            return null;
        }
    }

    var currentRouteId = 0;
    var lastInserted   = null;

    for (var key in routes)
    {
        var route = routes[key];
        if (sectionOrderInRoutes[route.id] && sectionOrderInRoutes[route.id] >= (route.route_section_max_order - solver_conf.LAST_SECTIONS_COUNT) && routeSectionOrder[imei]['onSameSectionCount'] >= solver_conf.MAX_STAY_COUNT_ON_LAST_SECTIONS){
            cache.del(imei);
            return null;
        }
        else {
            var currentDate = new Date();
            if (routeSectionOrder[route.id] && isApproximatelyRising(routeSectionOrder[route.id]['orderSequence'])
                && (!lastInserted || lastInserted < routeSectionOrder[route.id]['lastInserted'])
                && (currentDate - routeSectionOrder[route.id]['lastInserted']) / 1000 < solver_conf.OFF_LINE_TIME_TO_CHANGE_STATUS) {
                currentRouteId = route.id;
                lastInserted = routeSectionOrder[route.id]['lastInserted'];
            }
        }
    }

    if (currentRouteId) {
        routeSectionOrder['lastRouteId'] = currentRouteId;
        cache.put(imei, routeSectionOrder, 10000);
        return currentRouteId;
    }

    cache.del(imei);
    return null;
}


/**
 * This function is used to collect bus info (sections order in the route)
 * Return currentSectionId section's order in the routes
 *
 * @param routeSectionOrder
 * @param imei
 * @param currentSectionId
 */
function collectBusPlaces(routeSectionOrder, imei, currentSectionId)
{
    if (!routeSectionOrder){
        routeSectionOrder = {offLineDataCount: 0, onSameSectionCount: 0};
    }

    if (!currentSectionId){
        routeSectionOrder['offLineDataCount']++;
        return;
    }
    else {
        routeSectionOrder['offLineDataCount'] = 0;
    }

    var line_number = loader.findLineByImei(imei);
    var sections    = loader.findSectionsByLine(line_number);

    //Need to collect currentSectionId section's order in the routes
    var sectionOrderInRoutes = [];

    sections[currentSectionId].route_section.forEach(function (routeSection) {

        sectionOrderInRoutes[routeSection.route.id] = routeSection.order;

        if (!routeSectionOrder[routeSection.route.id]) {
            routeSectionOrder[routeSection.route.id] = {orderSequence: []};
        }

        console.log(process.pid, imei, routeSectionOrder[routeSection.route.id]['orderSequence']);

        if (routeSectionOrder[routeSection.route.id]['orderSequence'].indexOf(routeSection.order) == -1) {
            routeSectionOrder[routeSection.route.id]['orderSequence'].push(routeSection.order);
            routeSectionOrder['onSameSectionCount'] = 1;
        }
        else {
            routeSectionOrder['onSameSectionCount']++;
        }

        //Change lastInserted date to know last incoming valid data date
        routeSectionOrder[routeSection.route.id]['lastInserted'] = new Date();

        if (routeSectionOrder[routeSection.route.id]['orderSequence'].length > solver_conf.COLLECT_COUNT_FOR_ROUTE) {
            routeSectionOrder[routeSection.route.id]['orderSequence'].shift();
        }
    });

    return sectionOrderInRoutes;
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