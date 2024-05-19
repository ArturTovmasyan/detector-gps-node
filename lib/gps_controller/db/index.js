/**
 * Created by andranik on 3/16/15.
 */

var connection = require('../../db').connect();

//module.exports.flush = function(IMEI, data) {//imei, timestamp, priority, longitude, latitude, altitude, angle, satellites, speed) {
//    connection.query("INSERT INTO gps_info SET ?", {
//                                    IMEI: IMEI,
//                                    timestamp: data.timestamp,
//
//    });
//};