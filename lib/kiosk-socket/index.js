'use strict';

var express  = require('express');
var app      = express();
var server   = require('http').Server(app);
var io       = require('socket.io')(server);
var config   = require('../../config/parameters').kiosk;

/**
 * listen the port for kiosks
 */
server.listen(config.port);

/**
 * Join to it's room when client send message
 */
io.on('connection',function(socket){
    socket.on('message',function(stopId){
        socket.join('' + stopId);
    });
});

/**
 * @type {*|exports}
 */
module.exports.socketIo = io;