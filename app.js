/**
 * Created by andranik on 3/11/15.
 */

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var log     = require('./lib/logger');
var api     = require('./lib/api-controller');
var loader  = require('./lib/data-loader/loader');
var param   = require('./config/parameters');
var solver  = require('./lib/solver');
var sync    = require('./lib/synchronizer');

var viewControl = require('./lib/view-controller');
var io          = viewControl.get_socket();


/*********************************************************************************************
 currentBusPositions: structure

 {
     256632985632154: {busInfo described in lib/solver/index.js},
     172554113625478: {busInfo described in lib/solver/index.js},
     ...
 }

 busesOrderInRoutes: structure

 {
     47: { 8: { 125632874521563: 168, 965425874365219: 205, 687526984365185: 105 },
           9: { 635478521469854: 8, 265395415215495: 58, 635247851269537: 108 } },
     58: { ... }
 }

 ***********************************************************************************************/



if (cluster.isMaster) {

    var workers = [];
    //Object to collect all fresh data from gps
    var currentBusPositions = {};
    for (var i = 0; i < numCPUs; i++) {
        workers[i] = cluster.fork();

        workers[i].on('message', function(msg) {
            if (msg.busInfo) {
                if (!currentBusPositions[msg.busInfo.gpsData.imei] || currentBusPositions[msg.busInfo.gpsData.imei].gpsData.timestamp < msg.busInfo.gpsData.timestamp)
                {
                    currentBusPositions[msg.busInfo.gpsData.imei] = msg.busInfo;
                    io.send({busInfo: msg.busInfo});


                }
            }
        });
    }

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

    //Start listen on 8000 port for incoming api requests
    var apiEmitter = api.start(param.api_controller.port);

    //listen for incoming commands
    apiEmitter.on('load_buses', function() {
        workers.forEach(function(worker) {
            worker.send({load_buses: true});
        })
    });
    apiEmitter.on('load_routes', function() {
        workers.forEach(function(worker) {
            worker.send({load_routes: true});
        })
    });
}
else {

    //Load data to start a work
    var buses = loader.getBusesSync();
    var routes = loader.getRoutesSync();

    //check data from parent and do corresponding actions
    process.on('message', function (msg) {
        if (msg.load_buses) {
            loader.getBuses(function (err, data) {
                buses = data;
                console.log('_____buses_loaded_____ process id:' + process.pid);
            });
        }
        if (msg.load_routes) {
            loader.getRoutes(function (err, data) {
                routes = data;
                console.log('_____routes_loaded_____ process id:' + process.pid);
            });
        }
    });

    var dataListener = solver.start();

    dataListener.on('data', function(busInfo) {
        process.send({busInfo: busInfo});
    });
}