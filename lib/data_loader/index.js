/**
 * Created by andranik on 3/11/15.
 */

var node_rest_client = require('node-rest-client');
var loader_conf      = require('../../config/parameters').loader;

var Client = node_rest_client.Client;
var client = new Client();

/*--------------------------------------------------------------*/
client.registerMethod("VectorPartImei", loader_conf.host + "/api/", "GET");
/**
 * @param imei
 * @returns {Array}
 */
function getVectorPartsByImei(imei) {
    var argv = null;
    client.methods.VectorPartImei(argv,function(data,res){
        console.log(data);
        // raw response
        console.log(res);
    });
    return [];
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