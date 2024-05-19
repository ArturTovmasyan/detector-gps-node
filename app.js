/**
 * Created by andranik on 3/11/15.
 */

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var logger  = require('./lib/logger');
var api     = require('./lib/api_controller');
var gps     = require('./lib/gps_controller');
var loader  = require('./lib/data_loader');

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);




if (cluster.isMaster) {

    var workers = [];
    //Object to collect all fresh data from gps
    var currentBusPositions = {};

    for (var i = 0; i < numCPUs; i++) {
        workers[i] = cluster.fork();

        workers[i].on('message', function(msg) {
            if (msg.gpsData) {
                if (!currentBusPositions[msg.gpsData.IMEI] || currentBusPositions[msg.gpsData.IMEI].timestamp < msg.gpsData.data.timestamp) {
                    currentBusPositions[msg.gpsData.IMEI] = msg.gpsData.data;
                    msg.gpsData.data.IMEI = msg.gpsData.IMEI;

                    io.send(msg.gpsData.data);
                    //TODO: need to send by socket to the map currentBusPositions or only msg.gpsData
                    console.log(msg.gpsData.data);
                }
            }
        });
    }

    server.listen(7777);

    app.get('/', function (req, res) {
        res.sendfile(__dirname + '/lib/socket/socket.io.html');
    });

    io.on('connection', function(){
        console.log('a user connected');
    });


    //Start listen on 8000 port for incoming api requests
    var apiEmitter = api.start(8000);

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
    var dataListener = gps.start(3129);

    //When get gps data send it to the master process
    dataListener.on('data', function(gpsData) {
        process.send({gpsData: gpsData});
    });
}

