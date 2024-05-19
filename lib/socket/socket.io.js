/**
 * Created by hazarapet on 3/13/15.
 */
var app = require('express')();
var io = require('socket.io').listen(3000);

io.on('connection', function(socket){
    console.log('a user connected');
    setTimeout(function(){
        socket.emit('message',{message: "What's up?"});
    },4000);
});