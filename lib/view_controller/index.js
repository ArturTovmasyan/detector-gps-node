/**
 * Created by andranik on 3/17/15.
 */

var http = require('http');
var fs = require('fs');
var url = require('url');

function listen(portNumber) {


    server = http.createServer(function(req, res) {
        if (req.url == '/charts') {
            fs.createReadStream(__dirname + '/../../view/statistics/gps_requests_chart.html').pipe(res);
        }
    });

    server.listen(portNumber)
}

module.exports.listen = listen;
