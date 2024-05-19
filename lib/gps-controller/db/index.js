/**
 * Created by andranik on 3/16/15.
 */

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
var connection = require('../../db').connect();
=======
var sequelize = require('../../models').sequelize;
>>>>>>> ad0ba79 (correction)
=======
var sequelize = require('../../models/Sequelize');
>>>>>>> b6fc0d4 (models)

<<<<<<< HEAD
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
=======
var GpsStatistic = require('../../models').GpsStatistic;
>>>>>>> cf2c2f7 (graph query)

<<<<<<< HEAD

module.exports.beginTransaction = function (errorCallback) {
    connection.beginTransaction(errorCallback);
};

module.exports.commit = function (errorCallback) {
    connection.commit(errorCallback);
};
=======
=======
/**
 * This function is used to get statistic data grouped by IMEI
 * @param from
 * @param to
 * @param callback
 * @returns {*|Bluebird.Promise}
 */
>>>>>>> 0c374b1 (graphics)
function getDataGroupedByIMEIs(from, to, callback) {

    var where = "";
    if (from && to) {
        where = "WHERE date >= '" + from + "' AND date <= '" + to + "'";
    }

    return sequelize.query("SELECT imei, SUM(number_valid) as okCount, (SUM(number_valid) + SUM(number_invalid)) as allCount FROM gps_statistic " + where + " GROUP BY imei")
        .then(function(results, metadata) {
            callback(null, results[0]);
        });
}

/**
 * This function is used to get statistic data for current imei grouped by date
 * @param IMEI
 * @param from
 * @param to
 * @param callback
 * @returns {*|Bluebird.Promise}
 */
function getDataGroupedByDates(IMEI, from, to, callback) {

    var where = "";
    if (from && to) {
        where = " AND date >= '" + from + "' AND date <= '" + to + "'";
    }

    return sequelize.query("SELECT date, SUM(number_valid) as okCount, (SUM(number_valid) + SUM(number_invalid)) as allCount FROM gps_statistic WHERE imei = " + IMEI + where + " GROUP BY date")
        .then(function(results, metadata) {
            callback(null, results[0]);
        });
}

//This function is used to get data grouped by IMEIs
module.exports.getDataGroupedByIMEIs = getDataGroupedByIMEIs;

//This function is used to get data grouped by days
module.exports.getDataGroupedByDates = getDataGroupedByDates;
>>>>>>> 5aa18a4 (corrections)
