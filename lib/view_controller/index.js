/**
 * Created by andranik on 3/17/15.
 */

var express = require('express');
var app     = express();
var server  = require('http').Server(app);
var config  = require('../../config/parameters').express;

/**
 * Register static files
 */
app.use(express.static(config.public_vendor));

/**
 * Router
 * /
 */
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/view/socket/socket.io.html');
});

/**
 * Router
 * /chart
 */
app.get('/chart', function (req, res) {
    res.sendFile(__dirname + '/view/statistics/gps_requests_chart.html');
});

/**
 * @param portNumber
 */
function listen(portNumber) {
    server.listen(portNumber)
};

module.exports.listen = listen;
