'use strict';

var express  = require('express');
var app      = express();
var server   = require('http').Server(app);
var io       = require('socket.io')(server);

/**
 * Register static files
 */
app.use(express.static('../../../../lib/view-controller/Resources/'));

/**
 * Register static files
 */
app.use(express.static('../../../../node_modules'));

/**
 * Testing Side
 */
server.listen(4296);

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

io.on('connection', function(){
    console.log('client has been connected',io);
});