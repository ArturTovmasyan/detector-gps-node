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

app.all('/api/routes_per*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.post('/api/routes_per_bus', function (req, res) {

    req.on('data', function(data) {

        data = JSON.parse(data.toString());
        var routeIds = data.routeIds;
        var dateFrom = data.dateFrom;
        var dateTo   = data.dateTo;

        if (!routeIds || !routeIds.length || !dateFrom || !dateTo){
            res.end('Bad request');
        }

        sequelize.query("SELECT imei, DATE(start_date) as date, COUNT(imei) as cnt FROM bus_routes WHERE route_id IN (" + routeIds.join(' , ') + ") AND DATE(start_date) >= '" + dateFrom + "' AND DATE(end_date) <= '" + dateTo + "' GROUP BY imei, DATE(start_date) ORDER BY imei")
            .then(function (results) {
                res.end(JSON.stringify(results[0]));
            });
    });
});

/*

 SELECT DISTINCT route_id, DATE(start_date), HOUR(start_date),
        (SELECT count(*) FROM bus_routes as b1
         WHERE b1.route_id = b.route_id AND
            (DATE(b1.start_date) = DATE(b.start_date) AND HOUR(b1.start_date) <= HOUR(b.start_date) AND HOUR(b1.end_date) >= HOUR(b.start_date)) OR
            (DATE(b1.start_date) = DATE(b.start_date) AND DATE(b1.end_date) = DATE(DATE_ADD(b.start_date, INTERVAL 1 DAY)) AND HOUR(b1.start_date) <= HOUR(b.start_date))
         ) as cnt
 FROM bus_routes as b
 WHERE route_id IN (8, 9)
 ORDER BY DATE(start_date), HOUR(start_date);


 */

app.post('/api/routes_per_hour', function (req, res) {

    req.on('data', function(data) {

        data = JSON.parse(data.toString());
        var routeIds = data.routeIds;
        var dateFrom = data.dateFrom;
        var dateTo   = data.dateTo;

        if (!routeIds || !routeIds.length || !dateFrom || !dateTo){
            res.end('Bad request');
        }

        if (routeIds.length > 0)
            sequelize.query("SELECT DISTINCT route_id, DATE(start_date), HOUR(start_date), " +
                            "(SELECT count(*) FROM bus_routes as b1 " +
                            "WHERE b1.route_id = b.route_id AND " +
                            "(DATE(b1.start_date) = DATE(b.start_date) AND HOUR(b1.start_date) <= HOUR(b.start_date) AND HOUR(b1.end_date) >= HOUR(b.start_date)) OR " +
                            "(DATE(b1.start_date) = DATE(b.start_date) AND DATE(b1.end_date) = DATE(DATE_ADD(b.start_date, INTERVAL 1 DAY)) AND HOUR(b1.start_date) <= HOUR(b.start_date)) ) as cnt " +
                            "FROM bus_routes as b " +
                            "WHERE route_id IN (" + routeIds.join(' , ') + ") AND DATE(start_date) >= '" + dateFrom + "' AND DATE(end_date) <= '" + dateTo + "' " +
                            "ORDER BY DATE(start_date), HOUR(start_date);")
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
