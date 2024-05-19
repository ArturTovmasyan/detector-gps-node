/**
 * Created by andranik on 7/20/15.
 */

var loader      = require('../data-loader/loader');
var loader1     = require('../data-loader');
var loader_conf = require('../../config/parameters').loader;
var sequelize = require('../models/Sequelize');

var lineNumber = 44;
var lastTimestamp = new Date('2015-07-20');

if (!loader.lines[lineNumber]){
    loader.loadLines().on(loader_conf.lines_ready_event, function(data) {
        afterLineRoutesLoad(data.lines[lineNumber]);
    })
}
else {
    afterLineRoutesLoad(loader.lines[lineNumber]);
}


/**
 TODO: Data count fo calculation

 busesRoutes variable structure

 {
     123456789012345: {
         lastRouteNumber: 2;
         1: {
             route_id: 8,
             start_date: '2015-07-20 12:25:15',
             end_date: '2015-07-20 13:10:13',
             1: 12,
             2: 15,
             3: 11,
             4: 9,
             end_data_count_before_timestamp: 0
         },
         2: {
             route_id: 9,
             start_date: '2015-07-20 13:30:14',
             end_date: '2015-07-20 14:21:05',
             1: 10,
             2: 18,
             3: 13,
             4: 15,
             end_data_count_before_timestamp: 2
         }
     }
 }

 */

/**
 * @param lineRoutes
 */
function afterLineRoutesLoad(lineRoutes)
{
    var routes = [];
    for (k in lineRoutes.routes){
        routes.push(lineRoutes.routes[k].id);
        try {
            loader1.getSectionPartsOrders(lineRoutes.routes[k].id);
        }
        catch(e) {
            console.log(e.message);
        }
    }

    setTimeout(function ()
    {
        var busesRoutes = {};

        sequelize.query("SELECT * " +
        "FROM gps_data as i " +
        "WHERE TIMESTAMPDIFF(MINUTE, '2015-07-20 14:30:00', i.timestamp) > -90 AND i.route_id IN (" + routes.join(" , ") + ") " +
        "ORDER BY i.timestamp ")
            .then(function (results) {
                results = results[0];

                for(key in results){
                    var imei = results[key].imei;
                    if (!busesRoutes[imei]){
                        busesRoutes[imei] = {lastRouteNumber: 0};
                    }

                    if (!busesRoutes[imei][busesRoutes[imei].lastRouteNumber] || busesRoutes[imei][busesRoutes[imei].lastRouteNumber].route_id != results[key].route_id){
                        busesRoutes[imei].lastRouteNumber++;
                        busesRoutes[imei][busesRoutes[imei].lastRouteNumber] = {route_id: results[key].route_id, start_date: results[key].timestamp};
                    }

                    var partNumber = inWichPart(results[key].section_part_id, loader1.getSectionPartsOrders(results[key].route_id));

                    if (partNumber) {
                        if (!busesRoutes[imei][busesRoutes[imei].lastRouteNumber][partNumber]) {
                            busesRoutes[imei][busesRoutes[imei].lastRouteNumber][partNumber] = 0;
                        }

                        busesRoutes[imei][busesRoutes[imei].lastRouteNumber][partNumber]++;
                    }
                }

                console.log(busesRoutes);
            })

    }, 5000);
}

/**
 * This function return in which part of sectionPartsOrder is sectionPartId
 *      1st part - 10%-20%
 *      2nd part - 35%-45%
 *      3th part - 55%-65%
 *      4th part - 80%-90%
 *
 * @param sectionPartId
 * @param sectionPartsOrder
 * @returns {number}
 */
function inWichPart(sectionPartId, sectionPartsOrder)
{
    for (var i = 0; i < sectionPartsOrder.length; i++){
        if (sectionPartId == sectionPartsOrder[i].id){
            break;
        }
    }

    var persent = i * 100 / sectionPartsOrder.length;

    if (persent >= 10 && persent <= 20){
        return 1;
    }
    else if (persent >= 35 && persent <= 45){
        return 2;
    }
    else if (persent >= 55 && persent <= 65){
        return 3;
    }
    else if (persent >= 80 && persent <= 90){
        return 4;
    }

    return 0;
}