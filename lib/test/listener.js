/**
 * Created by andranik on 7/2/15.
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
        console.log(data.toString());
    });
}).listen(9999, '127.0.0.1', function() {
    console.log('start to listen!!!');
});