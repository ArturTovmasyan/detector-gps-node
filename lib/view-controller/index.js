/**
 * Created by andranik on 3/17/15.
 */

var express  = require('express');
var app      = express();
var server   = require('http').Server(app);
var io       = require('socket.io')(server);
var db       = require('../gps-controller/db');
var log      = require('../logger');

var loader   = require('../data-loader');

var config   = require('../../config/parameters').express;

/**
 * Register static files
 */
app.use(express.static(config.public_vendor));

/**
 * Register static files
 */
app.use(express.static(config.resources));

/**
 * Router
 * /map
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


app.post('/api/charts_data', function (req, res) {

    req.on('data', function(data) {

        data = JSON.parse(data.toString());

        if (!data.imei || data.imei == '0') {
            db.getDataGroupedByIMEIs(data.from, data.to, function (err, rows) {
                if (err) {
                    log.error('error during get data ' + err);
                    res.end('error during get data ' + err);
                }
                var buses = {};
                try {
                    buses = loader.findBuses();
                    console.log(buses);
                    for (var i = 0; i < rows.length; i++) {
                        if (buses[rows[i].imei]) {
                            delete buses[rows[i].imei];
                        }
                    }
                }
                catch(err) {
                    log.error(err);
                }

                var returnData = {chartData: rows, idleGpses: buses};

                res.end(JSON.stringify(returnData));
            });
        }
        else {
            db.getDataGroupedByDates(data.imei, data.from, data.to, function (err, rows) {
                if (err) {
                    log.error('error during get data ' + err);
                    res.end('error during get data ' + err);
                }

                res.end(JSON.stringify(rows));
            });
        }
    });
});


/**
 * @type {express_start}
 */
module.exports.express_start = express_start;

/**
 * @type {getSocket}
 */
module.exports.get_socket = getSocket;
