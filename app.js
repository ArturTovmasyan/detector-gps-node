/**
 * Created by andranik on 3/11/15.
 */

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var logger  = require('./lib/logger');
var api     = require('./lib/api_controller');
var gps     = require('./lib/gps_controller');
var loader  = require('./lib/data_loader');


if (cluster.isMaster) {

    var workers = [];

    for (var i = 0; i < numCPUs; i++) {
        workers[i] = cluster.fork();
    }

    //Start listen on 8000 port for incoming api requests
    var apiEmitter = api.start(8000);

    //listen for incoming commands
    apiEmitter.on('load_buses', function() {
        workers.forEach(function(worker) {
            worker.send('load_buses');
        })
    });
    apiEmitter.on('load_routes', function() {
        workers.forEach(function(worker) {
            worker.send('load_routes');
        })
    });
}
else {

    //Load data to start a work
    var buses = loader.getBusesSync();
    var routes = loader.getRoutesSync();

    //check data from parent and do corresponding actions
    process.on('message', function (msg) {
        if (msg == 'load_buses') {
            loader.getBuses(function (err, data) {
                buses = data;
                console.log('_____buses_loaded_____ process id:' + process.pid);
            });
        }
        if (msg == 'load_routes') {
            loader.getRoutes(function (err, data) {
                routes = data;
                console.log('_____routes_loaded_____ process id:' + process.pid);
            });
        }
    });

    //start listen for incoming requests from gps devices
    gps.start(3129);
}

