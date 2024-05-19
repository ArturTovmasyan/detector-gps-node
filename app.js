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
var stat    = require('./lib/statistic');
var api     = require('./lib/api-controller');

var viewControl = require('./lib/view-controller');
var io          = viewControl.get_socket();

/*********************************************************************************************
 currentBusPositions: structure

 {
     256632985632154: {busInfo described in lib/solver/index.js && frontImei: 256354562148765, backImei: 256357845862545},
     172554113625478: {busInfo described in lib/solver/index.js && frontImei: 115225482526947, backImei: 256357845785145},
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

    var kioskSocket = require('./lib/kiosk-socket').socketIo;
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
                    currentBusPositions[msg.busInfo.gpsData.imei] = msg.busInfo;
                    consecutiveBuses(msg.busInfo.gpsData.imei, currentBusPositions, busesOrderInRoutes);

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

                    io.send({busInfo: msg.busInfo});
                }
            }
        });
    }

    io.on('connection', function() {
        //io.send(currentBusPositions);
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

    setInterval(function(){
        sync.syncronize();

        for(var imei in currentBusPositions){
            busInfo = currentBusPositions[imei];
            var currentDate = new Date();
            if (((currentDate - busInfo.gpsData.timestamp) / 60000) > 10){
                busInfo.busStatus = 'no_data'
            }
        }
    }, 600000);

    viewControl.express_start(param.express.stop_port);
}
else {

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






/*************************************************************************
* This function is used to determine consecutive buses for the given bus *
**************************************************************************/
function consecutiveBuses(imei, currentBusPositions, busesOrderInRoutes){

    var newBasInfo   = currentBusPositions[imei];
    var lineNumber   = newBasInfo.lineNumber;
    var sectionOrder = newBasInfo.section_order;
    var routeId      = newBasInfo.gpsData.route_id;

    if (!lineNumber || !sectionOrder || !routeId){
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
        for (var k in busesOrderInRoutes[lineNumber]){
            var busesOrderInRoute = busesOrderInRoutes[lineNumber][k];

            if (busesOrderInRoute[imei]){
                if (newBasInfo.frontImei) {
                    currentBusPositions[newBasInfo.frontImei].backImei = null;
                }
                if (newBasInfo.backImei) {
                    currentBusPositions[newBasInfo.backImei].frontImei = null;
                }

                delete busesOrderInRoute[imei];
            }
        }
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


    //Calculate statistic data
    try {
        if (currentBusPositions[frontImei] && newBasInfo.gpsData.section_part_id && currentBusPositions[frontImei].gpsData.section_part_id) {
            newBasInfo.statistic = stat.getTimeStatistics(routeId, newBasInfo.gpsData.section_part_id, currentBusPositions[frontImei].gpsData.section_part_id);
        }
    }
    catch (e) {
        //console.error(e.message);
    }
}