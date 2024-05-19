/**
 * Created by hazarapet on 3/11/15.
 */

var http = require('http');
var config = require("../../config/parameters").api_controller;
var ee = require("events").EventEmitter;

var server = null;
var event = new ee;

/**
 *
 * @param port_number
 * @param host
 * @param err
 */
function start(port_number, host, err) {
    server = createServer(err);
    listen(port_number, host, server, err);

    return event;
}
/**
 *
 */
function createServer(err) {
    return http.createServer(function(req,res){
        checker(req, err);
        res.write('');
        res.end();
    });
};

/**
 *
 * @param request_stream
 */
function checker(request_stream, err) {
    var url = request_stream.url;
    var method = request_stream.method;
    var obj = null;

    if(config.urls){
        obj = config.urls[url];

        if(!obj){
            err(new Error("Url not fount in url list"));
        }
        else if(!obj.event){
            err(new Error("There is no Event Name in Config"));
        }
        else if(!obj.method || obj.method === method){
            event.emit(obj.event,{param: 'World'});
        }
    }
};

/**
 *
 * @param port_number
 * @param host
 */
function listen(port_number, host, server, err) {
    if(server){
        server.listen(port_number, host);
    }
    else {
        err(new Error("The Server is not created"));
    }
}

/**
 *
 * @type {start}
 */
module.exports.start = start;