/**
 * Created by andranik on 7/20/15.
 */

var loader      = require('../data-loader/loader');
var loader1     = require('../data-loader');
var loader_conf = require('../../config/parameters').loader;
var sequelize   = require('../models/Sequelize');
var BusRoutes   = require('../models').BusRoutes;
var ee          = require("events").EventEmitter;

module.exports.calculateRoutes = calculateRoutes;



module.exports.commands = {
    'calculate:buses:routes': {
        "run": calculateRoutes,
        description: "This command is used to calculate last buses passed routes"
    }
};


function calculateRoutes() {
    if (Object.keys(loader.lines).length === 0) {
        loader.loadLines().on(loader_conf.lines_ready_event, function (data) {
            afterLinesLoad();
        });
    }
    else {
        afterLinesLoad();
    }
}


function afterLinesLoad() {

    sequelize.query("SELECT imei, MAX(end_date) as lastDate " +
                    "FROM bus_routes GROUP BY imei")
        .then(function (results) {
            results = results[0];

            sequelize.query("SELECT imei FROM bus_last_data as bld " +
                "WHERE imei NOT IN (SELECT DISTINCT imei FROM bus_routes)")
                .then(function(imeis) {
                    lastTimestamp = new Date();
                    lastTimestamp.setDate(lastTimestamp.getDate() - 1);

                    imeis = imeis[0];
                    for(var i in imeis){
                        results.push({imei: imeis[i].imei, lastDate: lastTimestamp});
                    }

                    loader.loadBuses()
                        .on(loader_conf.buses_ready_event, function(buses) {

                            afterBusLastDataLoad(results[0].imei, results[0].lastDate, 0)
                                .on('ready_for_next_data', function (i) {
                                    afterBusLastDataLoad(results[i + 1].imei, results[i + 1].lastDate, i + 1);
                                })
                        });
                });
        });
}


/**

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
             end_data_before_timestamp: 0
         },
         2: {
             route_id: 9,
             start_date: '2015-07-20 13:30:14',
             end_date: '2015-07-20 14:21:05',
             1: 10,
             2: 18,
             3: 13,
             4: 15,
             end_data_before_timestamp: 2
         }
     }
 }

 */

var event = new ee;

/**
 * @param imei
 * @param lastTimestamp
 * @param i
 */
function afterBusLastDataLoad(imei, lastTimestamp, i)
{

    try {
        var lineNumber = loader1.findLineByImei(imei);
    }
    catch(e) {
        event.emit('ready_for_next_data', i);
    }

    console.log(lineNumber, imei, lastTimestamp, i);

    var lineRoutes = loader.lines[lineNumber];

    if (lineRoutes.routes.length == 0){
        event.emit('ready_for_next_data', i);
    }

    for (k in lineRoutes.routes){
        try {
            loader1.getSectionPartsOrders(lineRoutes.routes[k].id);
        }
        catch(e){
            console.log(e.message);
        }
    }

    setTimeout(function () {

        sequelize.query("SELECT route_id, timestamp, section_part_id " +
            "FROM gps_data as i " +
            "WHERE TIMESTAMPDIFF(MINUTE, '" + lastTimestamp.toISOString().replace(/T/, ' ').replace(/\..+/, '') + "', i.timestamp) > 0 AND i.imei = " + imei + ' ' +
            "ORDER BY i.timestamp ")
            .then(function (results) {
                results = results[0];
                var busRoutes = {lastRouteNumber: 0};

                for (key in results) {

                    if (!busRoutes[busRoutes.lastRouteNumber] || busRoutes[busRoutes.lastRouteNumber].route_id != results[key].route_id) {
                        busRoutes.lastRouteNumber++;
                        busRoutes[busRoutes.lastRouteNumber] = {
                            route_id:   results[key].route_id,
                            start_date: results[key].timestamp
                        };
                    }

                    busRoutes[busRoutes.lastRouteNumber].end_date = results[key].timestamp;

                    var partNumber = inWichPart(results[key].section_part_id, loader1.getSectionPartsOrders(results[key].route_id));

                    if (partNumber) {
                        if (!busRoutes[busRoutes.lastRouteNumber][partNumber]) {
                            busRoutes[busRoutes.lastRouteNumber][partNumber] = 0;
                        }

                        busRoutes[busRoutes.lastRouteNumber][partNumber]++;
                    }
                }

                for (var num in busRoutes){
                    if (busRoutes[num][1] > 10 && busRoutes[num][2] > 10 && busRoutes[num][3] > 10 && busRoutes[num][4] > 10) {
                        BusRoutes.create({
                            imei:       imei,
                            route_id:   busRoutes[num].route_id,
                            start_date: busRoutes[num].start_date,
                            end_date:   busRoutes[num].end_date
                        });
                    }
                }

                event.emit('ready_for_next_data', i);
            })

            }, 5000);

    return event;
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