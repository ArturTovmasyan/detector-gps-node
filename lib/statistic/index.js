/**
 * Created by andranik on 6/16/15.
 */

var loader = require('../data-loader');
var cache             = require("memory-cache");
var cache_conf        = require("../../config/parameters").cache;
var rawStatistic      = require('../models').RawStatistic;

var sequelize         = require('../models/Sequelize');

/**
 *
 * @param routeId
 * @param sectionPartId1
 * @param sectionPartId2
 * @param coefficient
 * @param withoutStatisticTimeout
 * @returns {{passTime: number, stopTimes: {}}}
 */
function getTimeStatistics(routeId, sectionPartId1, sectionPartId2, coefficient, withoutStatisticTimeout) {

    if (!coefficient){
        coefficient = 1;
    }

    var sectionPartStatistic = loader.getSectionPartsStatistic(routeId, withoutStatisticTimeout);
    var sectionPartOrders    = loader.getSectionPartsOrders(routeId);

    if (sectionPartOrders.length != sectionPartStatistic.length){
        throw new Error('!!!PROBLEM WITH STATISTIC QUERIES COUNTS!!!');
    }

    var sectionPartOrder1 = -1;
    var sectionPartOrder2 = -1;

    for (var j = 0; j < sectionPartOrders.length; j++){
        if (sectionPartOrders[j].id == sectionPartId1){
            sectionPartOrder1 = j;
        }
        else if (sectionPartOrders[j].id == sectionPartId2){
            sectionPartOrder2 = j;
        }
        if (sectionPartOrder1 > -1 && sectionPartOrder2 > -1) {
            break;
        }
    }

    if (sectionPartOrder1 == -1) {
        throw new Error("Statistic calculate: routeId: " + routeId + " sectionPartId1: " + sectionPartId1 + " sectionPartId2: " + sectionPartId2 + " Bad section part ids");
    }

    sectionPartOrder2 = (sectionPartOrder2 != -1) ? sectionPartOrder2 : sectionPartStatistic.length;

    var stopTimes = {};
    var passTime = 0;
    for (var i = sectionPartOrder1; i < sectionPartOrder2; i++){
        passTime += sectionPartStatistic[i].pass_time * coefficient;

        if (sectionPartStatistic[i].stop_id && !stopTimes[sectionPartStatistic[i].stop_id] && sectionPartStatistic[i].stop_id != sectionPartStatistic[sectionPartOrder1].stop_id && sectionPartStatistic[i].stop_id != sectionPartStatistic[sectionPartOrder2].stop_id){
            stopTimes[sectionPartStatistic[i].stop_id] = passTime;
        }
    }

    if (sectionPartStatistic[sectionPartOrder1].stop_id){
        stopTimes[sectionPartStatistic[sectionPartOrder1].stop_id] = 0;
    }

    return {passTime: passTime, stopTimes: stopTimes};
}


/**
 * @param gpsData
 * @returns {*}
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

    if (sectionPartOrder2 < sectionPartOrder1) {
        return null;
    }

    //save new gpsData in the cache
    cache.put('lastGpsData_' + gpsData.imei, gpsData, cache_conf.expiration_time);

    //Calculate time difference between two data
    var timeToPass = (gpsData.timestamp - lastGpsData.timestamp) / 1000;

    //Validate time interval
    if (timeToPass < 0 || timeToPass > 300) {
        return null;
    }
    var singlePassTime = timeToPass / (sectionPartOrder2 - sectionPartOrder1);


    sequelize.transaction(function(t) {

        for(var i = sectionPartOrder1; i < sectionPartOrder2 - 1; i++) {
            rawStatistic.create({
                'section_part_id':      sectionPartOrders[i].id,
                'interval_to_pass':     singlePassTime,
                'route_id':             gpsData.route_id,
                'statistic_mode_code':  gpsData.statistic_mode_code
            });
        }

        return rawStatistic.create({
            'section_part_id':      sectionPartOrders[sectionPartOrder2 - 1].id,
            'interval_to_pass':     singlePassTime,
            'route_id': gpsData.    route_id,
            'statistic_mode_code':  gpsData.statistic_mode_code
        });
    });

    return true;
}


module.exports.getTimeStatistics = getTimeStatistics;
module.exports.saveStatistic     = saveStatistic;