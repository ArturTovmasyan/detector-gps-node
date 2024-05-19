/**
 * Created by hazarapet on 3/13/15.
 */
var config = require("../../config/socket");
var io = require('socket.io').listen(config.port);

io.on('connection', function(socket){
    console.log('a user connected');
    setInterval(function(){
        socket.send('I`m Server.Your Id: '+socket.id);
    },4000);
});



