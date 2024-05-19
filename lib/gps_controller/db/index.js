/**
 * Created by andranik on 3/16/15.
 */

var connection = require('../../db').connect();

module.exports.flush = function(IMEI, data, callback) {

    if (!IMEI || !data.timestamp || !data.priority || !data.longitude || !data.latitude || !data.altitude || !data.angle || !data.satellites || !data.speed) {
        callback(new Error('bad data'));
    }

    data.imei = IMEI;
    connection.query("INSERT INTO gps_info SET ?", data, function(err, result) {
        if (err) {
            callback(err);
        }
    });
};