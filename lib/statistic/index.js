/**
 * Created by andranik on 6/16/15.
 */

var loader = require('../data-loader');

/**
 * @param routeId
 * @param sectionPartId1
 * @param sectionPartId2
 * @returns {{passTime: number, stopTimes: {}}}
 */
function getTimeStatistics(routeId, sectionPartId1, sectionPartId2) {

    var sectionPartStatistic = loader.getSectionPartsStatistic(routeId);
    var sectionPartOrders    = loader.getSectionPartsOrders(routeId);

    var sectionPartOrder1 = sectionPartOrders.indexOf(sectionPartId1);
    var sectionPartOrder2 = sectionPartOrders.indexOf(sectionPartId2);

    console.log(sectionPartOrder1, sectionPartOrder2);
    console.log(sectionPartStatistic);
    
    if (!sectionPartOrder1 || !sectionPartOrder2) {
        throw new Error("Bad section part ids");
    }

    var stopTimes = {};
    for (var i = sectionPartOrder1; i <= sectionPartOrder2; i++){
        if (sectionPartStatistic[i].stop_id){
            stopTimes[sectionPartStatistic[i].stop_id] = sectionPartStatistic[i].pass_time - sectionPartStatistic[sectionPartOrder1].pass_time;
        }
    }

    return {passTime: sectionPartStatistic[sectionPartOrder2].pass_time - sectionPartStatistic[sectionPartOrder1].pass_time, stopTimes: stopTimes};
}


module.exports.getTimeStatistics = getTimeStatistics;