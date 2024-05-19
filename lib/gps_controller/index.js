/**
 * Created by andranik on 3/11/15.
 */

var net = require('net');

exports.start = function(port)
{
    var netServer = net.createServer(function (c) {
        c.pipe(process.stdout);
    }).listen(port);
};