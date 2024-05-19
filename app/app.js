/**
 * Created by andranik on 3/11/15.
 */

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var logger  = require('logger');
var api = require('api_controller');


if (cluster.isMaster) {

    var workers = [];

    for (var i = 0; i < numCPUs; i++) {
        workers[i] = cluster.fork();
    }

    api.start();

    api.on('bus_load', function() {

        for (var i = 0; i < numCPUs; i++) {
            workers[i].send();
        }

    });



    //Listen on worker messages
    workers[i].on('message', function(msg) {
        // ...
    });

    // workers[i].send({...});

}
else {

    process.on('message', function(msg){
        // ...
    });

    // process.send({...});

}

