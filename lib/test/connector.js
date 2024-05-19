/**
 * Created by andranik on 7/3/15.
 */

const net = require("net");

// Create a socket (client) that connects to the server
var socket = null;
setInterval(function() {

    var l = {};

    if(!socket) {
        socket = new net.Socket();
        l[socket] = 'iiii';
        socket.connect(9999, '127.0.0.1', function (s) {
            console.log(l[this]);
            console.log("Client: Connected to server");
            socket.write(JSON.stringify({ll: 'dddd'}));

            process.stdin.pipe(socket);//.write("gggfghfghdghdghdfghdfgh");
        });


        socket.on('error', function () {
            console.log('error');
            socket = null;
        });
    }

}, 1000);