/**
 * Created by andranik on 3/17/15.
 */

var express     = require('express');
var app         = express();
var server      = require('http').Server(app);
var io          = require('socket.io')(server);
var db          = require('../gps-controller/db');
var log         = require('../logger');

var loader      = require('../data-loader');
var config      = require('../../config/parameters').express;
var BusLastData = require('../models').BusLastData;
var sequelize   = require('../models/Sequelize');

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

app.get('/gps_list', function (req, res) {
    res.sendFile(__dirname + '/view/gps_list/gps_list.html');
});

app.get('/accuracy_list', function (req, res) {
    res.sendFile(__dirname + '/view/forecasting_errors/forecasting_errors.html');
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

                try {
                    var buses = JSON.parse(JSON.stringify(loader.findBuses()));
                    for (var i = 0; i < rows.length; i++) {
                        if (buses[rows[i].imei]) {
                            delete buses[rows[i].imei];
                        }
                    }

                    res.end(JSON.stringify({chartData: rows, idleGpses: buses}));
                }
                catch(e) {
                    console.log(e.message);
                }

                res.end(JSON.stringify({chartData: rows, idleGpses: buses}));
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

app.post('/api/buses_routes', function (req, res) {

    req.on('data', function(data) {

        var routeIds = JSON.parse(data.toString());
        //var routeIds = JSON.parse("[8, 9]");

        if (routeIds.length > 0)
        sequelize.query("SELECT imei, DATE(start_date), COUNT(imei)  FROM bus_routes WHERE route_id IN (" + routeIds.join(' , ') + ") GROUP BY imei, DATE(start_date) ORDER BY imei")
            .then(function (results) {
                res.end(JSON.stringify(results[0]));
            });
    });
});

app.get('/api/gps_data', function (req, res) {
    BusLastData.findAll().then(function(result) {
        res.end(JSON.stringify(result));
    })
});

var ForecastingError = require('../models').ForecastingError;

app.get('/api/forecasting_errors', function (req, res) {
    ForecastingError.findAll().then(function(result) {
        res.end(JSON.stringify(result));
    })
});


/**
 * @type {express_start}
 */
module.exports.express_start = express_start;

/**
 * @type {getSocket}
 */
module.exports.get_socket = getSocket;
