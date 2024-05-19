/**
 * Created by andranik on 6/16/15.
 */

var loader = require('../data-loader');
var cache             = require("memory-cache");
var cache_conf        = require("../../config/parameters").cache;
var rawStatistic      = require('../models').RawStatistic;

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
        throw new Error("Statistic calculate: routeId: " + routeId + " sectionPartId1: " + sectionPartId1 + " sectionPartId2: " + sectionPartId2 + " Bad section part ids");
    }

    var stopTimes = {};
    for (var i = sectionPartOrder1; i <= sectionPartOrder2; i++){
        if (sectionPartStatistic[i].stop_id){
            stopTimes[sectionPartStatistic[i].stop_id] = sectionPartStatistic[i].pass_time - sectionPartStatistic[sectionPartOrder1].pass_time;
        }
    }

    return {passTime: sectionPartStatistic[sectionPartOrder2].pass_time - sectionPartStatistic[sectionPartOrder1].pass_time, stopTimes: stopTimes};
}


/**
 * @param gpsData
 * @returns {null}
 */
function saveStatistic(gpsData)
{
    //Get last gpsData from cache
    var lastGpsData = cache.get('lastGpsData_' + gpsData.imei);

    //If there aren't last gpsData or it's for other route save new in cache and return
    if (!lastGpsData || lastGpsData.route_id != gpsData.route_id){
        cache.put('lastGpsData_' + gpsData.imei, gpsData, cache_conf.expiration_time);
        return null;
    }

    //Get section part ids
    var sectionPartId1 = lastGpsData.section_part_id;
    var sectionPartId2 = gpsData.section_part_id;

    //If on same section part do nothing
    if (sectionPartId1 == sectionPartId2){
        return null;
    }

    //save new gpsData in the cache
    cache.put('lastGpsData_' + gpsData.imei, gpsData, cache_conf.expiration_time);

    //Get route section part orders
    var sectionPartOrders = loader.getSectionPartsOrders(gpsData.route_id);

    var sectionPartOrder1 = -1;
    var sectionPartOrder2 = -1;

    //Find section start and end section part orders in route
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
        throw new Error("Statistic save:  routeId: " + gpsData.route_id + " sectionPartId1: " + sectionPartId1 + " sectionPartId2: " + sectionPartId2 + " Bad section part ids");
    }

    //Calculate time difference between two data
    var timeToPass = (gpsData.timestamp - lastGpsData.timestamp) / 1000;

    //Validate time interval
    if (timeToPass < 0 || timeToPass > 300) {
        return null;
    }
    var singlePassTime = timeToPass / (sectionPartOrder2 - sectionPartOrder1);

    for(var i = sectionPartOrder1; i < sectionPartOrder2; i++){

        console.log(sectionPartOrders[i].id, singlePassTime);
        //rawStatistic.create({
        //    'section_part_id':      sectionPartOrders[i].id,
        //    'interval_to_pass':     singlePassTime,
        //    'route_id':             gpsData.route_id,
        //    'statistic_mode_code':  gpsData.statistic_mode_code})
    }

    return true;
}


module.exports.getTimeStatistics = getTimeStatistics;
module.exports.saveStatistic     = saveStatistic;