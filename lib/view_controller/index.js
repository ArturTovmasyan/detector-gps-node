/**
 * Created by andranik on 3/17/15.
 */

var express = require('express');
var app     = express();
var server  = require('http').Server(app);
var io      = require('socket.io')(server);
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
function express_start(portNumber) {
    server.listen(portNumber)
};

/*------------------------Socket Side---------------------------*/
/**
 * Socket onConnection event
 */
io.on('connection', function(){
    console.log('a user connected');
});

/**
 * Getting the socket
 * @returns {*|exports}
 */
function getSocket(){
    return io;
}
/*-------------------------End Socket----------------------------*/
/**
 * @type {express_start}
 */
module.exports.express_start = express_start;

/**
 * @type {getSocket}
 */
module.exports.get_socket = getSocket;
