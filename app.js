/**
 * Created by andranik on 3/11/15.
 */

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var logger  = require('./logger');

if (cluster.isMaster) {

    var workers = [];

    for (var i = 0; i < numCPUs; i++) {
        workers[i] = cluster.fork();
    }



    //Listen on worker messages
    workers[i].on('message', function(msg) {
        // ...
    });

    // workers[i].send({...});

}
else {

    var net = require('net');

    var netServer = net.createServer(function (c) {

        c.pipe(process.stdout);

        c.on('data', function(data) {

        });
    });

    netServer.listen(50000);

    process.on('message', function(msg){
        // ...
    });

    // process.send({...});

}

