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
 * @param imei
 * @returns {Event}
 */
function getVectorPartsByImei(imei) {
    client.get(loader_conf.host + "/api/vectorparts/"+imei+"/imei", function(data){
        module.exports.get_vector_parts_by_imei = data;
        event.emit(loader_conf.vector_parts_ready_event,{msg: "vector parts are ready"});
    });

    return event;
}

/**
 * @type {getVectorPartsByImei}
 */
module.exports.get_vector_parts_by_imei = getVectorPartsByImei;

/**
 * @type {Array}
 */
module.exports.vector_parts_by_imei = [];
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