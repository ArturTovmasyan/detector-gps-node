/**
 * Created by andranik on 7/2/15.
 */


const net = require("net");

// Create a socket (client) that connects to the server
var socket = new net.Socket();
socket.connect(9999, '127.0.0.1', function () {
    console.log("Client: Connected to server");

    process.stdin.pipe(socket);//.write("gggfghfghdghdghdfghdfgh");
});

