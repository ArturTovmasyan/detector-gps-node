'use strict';

var express  = require('express');
var app      = express();
var server   = require('http').Server(app);
var io       = require('socket.io')(server);
var config   = require('../../config/parameters').customer;

/**
 * listen the port for kiosks
 */
server.listen(config.port);

/**
 * Join to it's room when client send message
 */
io.on('connection',function(socket){
    // need any hash or crypt for customer lines authentication
    socket.on('message',function(lines){
        for(var i = 0; i < lines.length; i++){
            socket.join('customerLine' + lines[i].number);
        }
    });
});

/**
 * @type {*|exports}
 */
module.exports.socketIo = io;
