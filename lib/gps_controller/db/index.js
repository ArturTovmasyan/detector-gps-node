/**
 * Created by andranik on 3/16/15.
 */

var connection = require('../../db').connect();

module.exports.flush = function(IMEI, data, callback) {

    if (data.timestamp == undefined || data.timestamp == null) {
        callback(new Error('invalid timestamp'));
    }
    if (data.priority == undefined || data.priority == null) {
        callback(new Error('invalid priority'));
    }
    if (data.longitude == undefined || data.longitude == null) {
        callback(new Error('invalid longitude'));
    }
    if (data.latitude == undefined || data.latitude == null) {
        callback(new Error('invalid latitude'));
    }
    if (data.altitude == undefined || data.altitude == null) {
        callback(new Error('invalid altitude'));
    }
    if (data.angle == undefined || data.angle == null) {
        callback(new Error('invalid angle'));
    }
    if (data.satellites == undefined || data.satellites == null) {
        callback(new Error('invalid satellites'));
    }
    if (data.speed == undefined || data.speed == null) {
        callback(new Error('invalid speed'));
    }
    if (IMEI == undefined || IMEI == null) {
        callback(new Error('invalid IMEI'));
    }

    data.IMEI = IMEI;
    connection.query("INSERT INTO gps_info SET ?", data, function(err, result) {
        if (err) {
            callback(err);
        }
    });
};