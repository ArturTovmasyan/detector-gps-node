/**
 * Created by hazarapet on 3/12/15.
 */
var WebSocketServer = require('ws').Server;
//var wss = new WebSocketServer({ port: 7777 });
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    // Fork workers.
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', function(worker) {
        console.log('worker ' + worker.process.pid + ' died');
    });
} else {
    var wss = new WebSocketServer({ port: 7777 });
    var processId = cluster.worker.id;

    wss.on('connection', function connection(ws) {
        ws.on('message', function incoming(message) {
            console.log('received: %s', processId, message);
        });
        setTimeout(function(){
            ws.send("Hello I'm Worker " + processId);
        },1000)
    });
}

