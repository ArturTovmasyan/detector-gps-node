/**
 * Created by andranik on 3/17/15.
 */

var express  = require('express');
var app      = express();
var server   = require('http').Server(app);
var io       = require('socket.io')(server);
var db       = require('../gps_controller/db');
var log      = require('../logger');

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

        if (!data.imei) {
            db.getDataGroupedByIMEIs(data.from, data.to, function (err, rows) {
                if (err) {
                    log.error('error during get data ' + err);
                    res.end('error during get data ' + err);
                }

                res.end(JSON.stringify(rows));
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
