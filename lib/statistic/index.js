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

    var sectionPartOrder1 = -1;
    var sectionPartOrder2 = -1;

    console.log(sectionPartOrders);
    console.log(sectionPartId1, sectionPartId2);

    for (var j = 0; j < sectionPartOrders.length; j++){
        if (sectionPartOrders[j].id == sectionPartId1) {
            sectionPartOrder1 = j;
        }
        else if (sectionPartOrders[j].id == sectionPartId2) {
            sectionPartOrder2 = j;
        }
        if (sectionPartOrder1 > -1 && sectionPartOrder2 > -1) {
            break;
        }
    }

    if (sectionPartOrder1 == -1 || sectionPartOrder2 == -1) {
        throw new Error("Bad section part ids");
    }

    var stopTimes = {};
    for (var i = sectionPartOrder1; i <= sectionPartOrder2; i++){
        console.log(sectionPartStatistic[i]);
        if (sectionPartStatistic[i].stop_id){
            stopTimes[sectionPartStatistic[i].stop_id] = sectionPartStatistic[i].pass_time - sectionPartStatistic[sectionPartOrder1].pass_time;
        }
    }

    return {passTime: sectionPartStatistic[sectionPartOrder2].pass_time - sectionPartStatistic[sectionPartOrder1].pass_time, stopTimes: stopTimes};
}


module.exports.getTimeStatistics = getTimeStatistics;


setInterval(function() {
    try {
        getTimeStatistics(8, 30013, 29926);
    }
    catch (e) {
        console.log(e.message);
    }
}, 2000);