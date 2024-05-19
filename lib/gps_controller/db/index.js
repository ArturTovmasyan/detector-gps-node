/**
 * Created by andranik on 3/16/15.
 */

var connection = require('../../db').connect();

function flush(IMEI, data, errorcallback) {

    if (data.timestamp == undefined || data.timestamp == null) {
        errorcallback(new Error('invalid timestamp'));
    }
    if (data.priority == undefined || data.priority == null) {
        errorcallback(new Error('invalid priority'));
    }
    if (data.longitude == undefined || data.longitude == null) {
        errorcallback(new Error('invalid longitude'));
    }
    if (data.latitude == undefined || data.latitude == null) {
        errorcallback(new Error('invalid latitude'));
    }
    if (data.altitude == undefined || data.altitude == null) {
        errorcallback(new Error('invalid altitude'));
    }
    if (data.angle == undefined || data.angle == null) {
        errorcallback(new Error('invalid angle'));
    }
    if (data.satellites == undefined || data.satellites == null) {
        errorcallback(new Error('invalid satellites'));
    }
    if (data.speed == undefined || data.speed == null) {
        errorcallback(new Error('invalid speed'));
    }
    if (IMEI == undefined || IMEI == null) {
        errorcallback(new Error('invalid IMEI'));
    }

    data.IMEI = IMEI;
    connection.query("INSERT INTO gps_info SET ?", data, function(err, result) {
        if (err) {
            errorcallback(err);
        }
    });
};

module.exports.beginTransaction = function (errorCallback) {
    connection.beginTransaction(errorCallback);
};

module.exports.commit = function (errorCallback) {
    connection.commit(errorCallback);
};
