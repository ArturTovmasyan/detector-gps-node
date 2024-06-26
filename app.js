/**
 * Created by andranik on 3/11/15.
 */

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var log     = require('./lib/logger');
var loader  = require('./lib/data-loader');
var loader1 = require('./lib/data-loader/loader');
var param   = require('./config/parameters');
var solver  = require('./lib/solver');
var sync    = require('./lib/synchronizer');
var rCalc   = require('./lib/passRoutesCalculator');
var stat    = require('./lib/statistic');
var api     = require('./lib/api-controller');
var statChecker = require('./lib/statistic/checker');


var viewControl = require('./lib/view-controller');
var io          = viewControl.get_socket();

/*********************************************************************************************
 currentBusPositions: structure

 {
     256632985632154: {busInfo described in lib/solver/index.js && frontImei: 256354562148765, backImei: 256357845862545, lastCoeff: 0.9, firstDataInRoute: { route_id: 8, timestamp: '2015-06-15 15:12:25', section_part_id: 25586} },
     172554113625478: {busInfo described in lib/solver/index.js && frontImei: 115225482526947, backImei: 256357845785145, lastCoeff: 0.18, firstDataInRoute: { route_id: 9, timestamp: '2015-06-16 18:28:25', section_part_id: 25596} },
     ...
 }

 busesOrderInRoutes: structure

 {
     47: { 8: { 125632874521563: 168, 965425874365219: 205, 687526984365185: 105 },
           9: { 635478521469854: 8, 265395415215495: 58, 635247851269537: 108 } },
     58: { ... }
 }

 ***********************************************************************************************/

if (cluster.isMaster){

    var kioskSocket    = require('./lib/kiosk-socket').socketIo;
    var customerSocket = require('./lib/customer-socket').socketIo;
    var workers = [];

    //Object to collect all fresh data from gps
    var currentBusPositions = {};

    //Object to collect buses order in routes
    var busesOrderInRoutes  = {};

    for (var i = 0; i < numCPUs; i++){
        workers[i] = cluster.fork();

        workers[i].on('message', function(msg) {
            if (msg.busInfo){
                if (!currentBusPositions[msg.busInfo.gpsData.imei] || currentBusPositions[msg.busInfo.gpsData.imei].gpsData.timestamp < msg.busInfo.gpsData.timestamp)
                {
                    //This part for saving first data in route for statistic coefficient calculation
                    if (currentBusPositions[msg.busInfo.gpsData.imei] &&
                        currentBusPositions[msg.busInfo.gpsData.imei].firstDataInRoute &&
                        currentBusPositions[msg.busInfo.gpsData.imei].firstDataInRoute.route_id == msg.busInfo.gpsData.route_id &&
                        (msg.busInfo.gpsData.timestamp - currentBusPositions[msg.busInfo.gpsData.imei].firstDataInRoute.timestamp) / 60000 < 5)
                    {
                        msg.busInfo.firstDataInRoute = currentBusPositions[msg.busInfo.gpsData.imei].firstDataInRoute;
                    }
                    else if (msg.busInfo.gpsData.route_id && msg.busInfo.gpsData.section_part_id) {
                        msg.busInfo.firstDataInRoute                 = {};
                        msg.busInfo.firstDataInRoute.route_id        = msg.busInfo.gpsData.route_id;
                        msg.busInfo.firstDataInRoute.timestamp       = msg.busInfo.gpsData.timestamp;
                        msg.busInfo.firstDataInRoute.section_part_id = msg.busInfo.gpsData.section_part_id;
                    }

                    currentBusPositions[msg.busInfo.gpsData.imei] = msg.busInfo;
                    consecutiveBuses(msg.busInfo.gpsData.imei, currentBusPositions, busesOrderInRoutes);

                    //Send bus data to nearest stops
                    if (msg.busInfo.statistic) {
                        for (var k in msg.busInfo.statistic.stopTimes) {
                            var sendData = {
                                "lineNumber":  msg.busInfo.lineNumber,
                                "routeId":     msg.busInfo.gpsData.route_id,
                                "latitude":    msg.busInfo.gpsData.latitude,
                                "longitude":   msg.busInfo.gpsData.longitude,
                                "time":        msg.busInfo.statistic.stopTimes[k] / 60
                            };

                            kioskSocket.to('' + k).send(sendData);
                        }
                    }

                    var busOrderInRoute = 0;
                    if (busesOrderInRoutes[msg.busInfo.lineNumber] && busesOrderInRoutes[msg.busInfo.lineNumber][msg.busInfo.gpsData.route_id]
                        && busesOrderInRoutes[msg.busInfo.lineNumber][msg.busInfo.gpsData.route_id][msg.busInfo.gpsData.imei]){
                        busOrderInRoute = busesOrderInRoutes[msg.busInfo.lineNumber][msg.busInfo.gpsData.route_id][msg.busInfo.gpsData.imei];
                    }

                    //Send bus data to corresponding customer
                    var customerData = {
                        imei:         msg.busInfo.gpsData.imei,
                        latitude:     msg.busInfo.gpsData.latitude,
                        longitude:    msg.busInfo.gpsData.longitude,
                        angle:        msg.busInfo.angle ? msg.busInfo.angle : msg.busInfo.gpsData.angle,
                        speed:        msg.busInfo.gpsData.speed,
                        route_id:     msg.busInfo.gpsData.route_id,
                        lineNumber:   msg.busInfo.lineNumber,
                        plateNumber:  msg.busInfo.plateNumber,
                        busStatus:    msg.busInfo.busStatus,
                        frontImei:    msg.busInfo.frontImei,
                        passTime:     msg.busInfo.statistic ? msg.busInfo.statistic.passTime : 0,
                        orderInRoute: busOrderInRoute
                    };

                    customerSocket.to('customerLine' + msg.busInfo.lineNumber).send(customerData);

                    io.send({busInfo: msg.busInfo});
                }
            }
        });
    }

    io.on('connection', function() {
        io.send(currentBusPositions);
    });

    var syncListener = sync.syncronize();
    syncListener.on('changes', function() {
        for(var k in workers){
            workers[k].send('reload');
        }
    });

    //Api controller
    api.start(param.api_controller.port, null, console.log)
        .on('load_buses', function(){
            for(var k in workers){
                workers[k].send('load_buses');
            }
    });

    var forecastingCheckDateTime = null;

    setInterval(function(){
        for(var imei in currentBusPositions){
            busInfo = currentBusPositions[imei];
            var currentDate = new Date();
            if (((currentDate - busInfo.gpsData.timestamp) / 60000) > 10){
                busInfo.busStatus = 'no_data'
            }
        }
    }, 600000);

    log.log('error', 'Logger check!!!');

    setInterval(function(){
        try {
            sync.syncronize();
        }
        catch(e){
            console.log(e.message);
        }

        //Calculate forecasting errors every day after 21:00
        var d = new Date();

        log.log('error', 'Hour timeout. Hour is: ' + d.getHours() +
                            ' forecasting check Date: ' + (forecastingCheckDateTime ? forecastingCheckDateTime.getDate() : 'null') +
                            ' current date: ' + d.getDate());

        if (d.getHours() >= 21 && (!forecastingCheckDateTime || forecastingCheckDateTime.getDate() != d.getDate())) {
            forecastingCheckDateTime = new Date();
            statChecker.calculateAllForecastingErrors(true);
        }

        //Calculate buses passed routes
        //rCalc.calculateRoutes();

    }, 3600000);

    viewControl.express_start(param.express.stop_port);
}
else {

    var memwatch = require('memwatch');
    memwatch.on('leak', function(stats) {
        log.log('error', stats);
        console.log(stats);
    });

    //var hd = new memwatch.HeapDiff();
    //setInterval(function() {
    //    var diff = hd.end();
    //    hd = new memwatch.HeapDiff();
    //    log.log('error', diff.change.details, process.pid);
    //}, 1800000);

    loader.setStatisticModeLoadingInterval(3600000);
    var dataListener = solver.start();

    dataListener.on('data', function(busInfo) {
        process.send({busInfo: busInfo});
    });

    process.on('message', function(msg) {
        if (msg == 'reload'){
            loader.reload();
        }
        if (msg == 'load_buses'){
            loader1.loadBuses();
        }
    });
}



var sequelize = require('./lib/models/Sequelize');
var BusMeanInterval = require('./lib/models').BusMeanInterval;



/*************************************************************************
* This function is used to determine consecutive buses for the given bus *
**************************************************************************/
function consecutiveBuses(imei, currentBusPositions, busesOrderInRoutes){

    var newBasInfo   = currentBusPositions[imei];
    var lineNumber   = newBasInfo.lineNumber;
    var sectionOrder = newBasInfo.section_order;
    var routeId      = newBasInfo.gpsData.route_id;

    if (!lineNumber){
        return null;
    }

    if (!sectionOrder || !routeId){
        removeBusDataFromOrdersArray(newBasInfo, busesOrderInRoutes);
        return null;
    }

    if (!busesOrderInRoutes[lineNumber]){
        busesOrderInRoutes[lineNumber] = {};
    }

    if (!busesOrderInRoutes[lineNumber][routeId]){
        busesOrderInRoutes[lineNumber][routeId] = {};
    }


    //If there aren't data with such imei remove data with such imei from other routes
    if (!busesOrderInRoutes[lineNumber][routeId][imei]){
        removeBusDataFromOrdersArray(newBasInfo, busesOrderInRoutes);
    }

    busesOrderInRoutes[lineNumber][routeId][imei] = sectionOrder;

    var frontImei = null;
    var backImei  = null;

    //Determine front and back buses
    var busOrdersInRoute =  busesOrderInRoutes[lineNumber][routeId];
    for (var tempImei in busOrdersInRoute){
        if (tempImei != imei){
            if (busOrdersInRoute[tempImei] > busOrdersInRoute[imei] && (frontImei == null || busOrdersInRoute[tempImei] < busOrdersInRoute[frontImei])){
                frontImei = tempImei;
            }

            if (busOrdersInRoute[tempImei] < busOrdersInRoute[imei] && (backImei == null || busOrdersInRoute[tempImei] > busOrdersInRoute[backImei])){
                backImei = tempImei;
            }
        }
    }


    //Set front and back imeis and change bront and back imeis of front and back buses
    newBasInfo.frontImei = frontImei;
    newBasInfo.backImei  = backImei;

    if (frontImei) {
        currentBusPositions[frontImei].backImei = imei;
    }

    if (backImei) {
        currentBusPositions[backImei].frontImei = imei;
    }

    //Calculate coefficient for based on last data for statistic
    if (!newBasInfo.lastCoeff){
        newBasInfo.lastCoeff = 1;
    }

    if (newBasInfo.firstDataInRoute &&  newBasInfo.firstDataInRoute.section_part_id != newBasInfo.gpsData.section_part_id) {
        try {
            var lastStatistic = stat.getTimeStatistics(newBasInfo.gpsData.route_id, newBasInfo.firstDataInRoute.section_part_id, newBasInfo.gpsData.section_part_id, 1, false);

            var coeff = ((newBasInfo.gpsData.timestamp - newBasInfo.firstDataInRoute.timestamp) / 1000) / lastStatistic.passTime;
            if (!coeff || coeff == Infinity) {
                coeff = 1;
            }
        }
        catch(e){
            console.log(e.message);
        }
    }

    if (coeff != 1){
        newBasInfo.lastCoeff = coeff;
    }

    //Calculate statistic data
    try {
        if (currentBusPositions[frontImei] && newBasInfo.gpsData.section_part_id && currentBusPositions[frontImei].gpsData.section_part_id) {
            newBasInfo.statistic = stat.getTimeStatistics(routeId, newBasInfo.gpsData.section_part_id, currentBusPositions[frontImei].gpsData.section_part_id, newBasInfo.lastCoeff, false);

            //TODO: may be used in future
            //if (newBasInfo.statistic.passTime && newBasInfo.statistic.passTime > 0) {
            //    var date = new Date(newBasInfo.gpsData.timestamp);
            //    var hour = date.getHours();
            //    date = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
            //
            //    BusMeanInterval.update(
            //        {
            //            line_number: newBasInfo.lineNumber,
            //            date: date,
            //            hour: hour,
            //            interval_sum: sequelize.literal('interval_sum + ' + newBasInfo.statistic.passTime),
            //            data_count: sequelize.literal('data_count + 1')
            //        },
            //        {where: {line_number: newBasInfo.lineNumber, date: date, hour: hour}}
            //    ).then(function (affectedRows) {
            //        if (affectedRows == 0) {
            //            BusMeanInterval.create({
            //                line_number: newBasInfo.lineNumber,
            //                date: date,
            //                hour: hour,
            //                interval_sum: newBasInfo.statistic.passTime,
            //                data_count: 1
            //            });
            //        }
            //    });
            //}
        }
    }
    catch (e) {
        //console.error(e.message);
    }
}

/**
 * @param busInfo
 * @param busesOrderInRoutes
 */
function removeBusDataFromOrdersArray(busInfo, busesOrderInRoutes){
    var lineNumber   = busInfo.lineNumber;
    var imei         = busInfo.gpsData.imei;

    if (busesOrderInRoutes[lineNumber]) {
        for (var k in busesOrderInRoutes[lineNumber]) {
            var busesOrderInRoute = busesOrderInRoutes[lineNumber][k];

            if (busesOrderInRoute[imei]) {
                if (busInfo.frontImei) {
                    currentBusPositions[busInfo.frontImei].backImei = busInfo.backImei;
                }
                if (busInfo.backImei) {
                    currentBusPositions[busInfo.backImei].frontImei = busInfo.frontImei;
                }

                delete busesOrderInRoute[imei];
            }
        }
    }
}