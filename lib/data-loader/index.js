/**
 * Created by andranik on 3/11/15.
 */

var Client           = require('node-rest-client').Client;
var ee               = new require("events").EventEmitter;
var loader_conf      = require('../../config/parameters').loader;

var event = new ee();
var client = new Client();

/*--------------------------------------------------------------*/

/**
 * @returns {ee}
 */
function getLines(){
    client.get(loader_conf.host + "/api/line/with/imei", function(data){
        var tmp = {};

        for(var i = 0; i < data.length; i++){
            tmp[ data[i].imei ] = data[i].lineId;
        }

        module.exports.lines = tmp;
        event.emit(loader_conf.lines_ready_event,{msg: "lines are ready"});
    });

    return event;
}

/**
 * @param lein
 * @returns {Event}
 */
function getVectorPartsByLine(line) {
    if(!module.exports.vector_parts_by_line[line]) {
        client.get(loader_conf.host + "/api/vectorparts/" + line + "/line", function (data) {
            module.exports.vector_parts_by_line[line] = data;
            event.emit(loader_conf.vector_parts_ready_event, {msg: "vector parts are ready"});
        });
    }
    else {
        event.emit(loader_conf.vector_parts_ready_event, {msg: "vector parts are ready"});
    }

    return event;
}

/**
 * @type {getVectorPartsByImei}
 */
module.exports.get_vector_parts_by_line = getVectorPartsByLine;

/**
 * @type {getLines}
 */
module.exports.get_lines = getLines;

/**
 * @type {Array}
 */
module.exports.vector_parts_by_line = [];

/**
 * @type {Array}
 */
module.exports.lines = [];
/*---------------------------------------------------------------*/

/**
 * @param callback
 */
exports.getBuses = function(callback) {

    try {
        callback(null, {buses: 'bus1, bus2'});
    }
    catch(e) {
        callback(new Error('error during load data'));
    }
};

/**
 * @returns {{buses: string}}
 */
exports.getBusesSync = function() {

    try {
        return {buses: 'bus1, bus2'};
    }
    catch(e) {
        throw new Error('error during load data');
    }
};

/**
 * @param callback
 */
exports.getRoutes = function(callback) {

    try {
        callback(null, {routes: 'bus1, bus2'});
    }
    catch(e) {
        callback(new Error('error during load data'));
    }
};

/**
 * @returns {{routes: string}}
 */
exports.getRoutesSync = function() {

    try {
        return {routes: 'bus1, bus2'};
    }
    catch(e) {
        throw new Error('error during load data');
    }
};