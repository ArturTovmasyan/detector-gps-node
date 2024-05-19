/**
 * Created by andranik on 3/11/15.
 */

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var log     = require('./lib/logger');
var api     = require('./lib/api-controller');
var gps     = require('./lib/gps-controller');
var loader  = require('./lib/data-loader');
var param   = require('./config/parameters');
var solver  = require('./lib/solver');


var viewControl = require('./lib/view-controller');
var io          = viewControl.get_socket();



if (cluster.isMaster) {

    var workers = [];
    //Object to collect all fresh data from gps
    var currentBusPositions = {};

    for (var i = 0; i < numCPUs; i++) {
        workers[i] = cluster.fork();

        workers[i].on('message', function(msg) {
            if (msg.gpsData) {
                if (!currentBusPositions[msg.gpsData.imei] || currentBusPositions[msg.gpsData.imei].timestamp < msg.gpsData.timestamp)
                {
                    currentBusPositions[msg.gpsData.imei] = msg.gpsData;

                    if (msg.sectionPart) {
                        try {
                            solver.findBusRoute(msg.gpsData.imei, msg.sectionPart.section.id);
                        }
                        catch(e) {
                            console.error(e.message);
                        }
                    }

                    if (solver.routeSectionOrder[msg.gpsData.imei]) {
                        solver.routeSectionOrder[msg.gpsData.imei].forEach(function (value, key) {
                            if (solver.isApproximatelyRising(value)) {
                                msg.gpsData.routeId = key;
                            }
                        });
                    }

                    io.send({data: msg.gpsData, section_part: msg.sectionPart, routeSectionOrder: solver.routeSectionOrder});
                }
            }
        });
    }

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

    //start listen for incoming requests from gps devices
    var dataListener = gps.start(param.gps_controller.port);

    //When get gps data send it to the master process
    dataListener.on('data', function(gpsData) {

        //Determine which section part is nearest to the bus
        var sectionPart = null;
        try {
            sectionPart = solver.findNearestSectionPart({imei:      gpsData.imei,
                                                         latitude:  gpsData.latitude / 10000000,
                                                         longitude: gpsData.longitude / 10000000});
        }
        catch(e) {
            console.error(e.message);
        }

        process.send({gpsData: gpsData, sectionPart: sectionPart});
    });
}

