/**
 * Created by andranik on 7/3/15.
 */
const net = require("net");

// Create a simple server
var server = net.createServer(function (conn) {
    console.log("Server: Client connected");

    // If connection is closed
    conn.on("end", function() {
        console.log('Server: Client disconnected');
        // Close the server
        server.close();
        // End the process
        process.exit(0);
    });

    // Handle data from client
    conn.on("data", function(data) {
        console.log(JSON.parse(data).ll);
    });
}).listen(9999, '127.0.0.1', function() {
    console.log('start to listen!!!');
});

var t = "123456789012345";
var buf = new Buffer(17);
buf.writeUInt16BE(15, 0);
buf.write(t, 2);
console.log(buf);

