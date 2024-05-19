/**
 * Created by andranik on 3/16/15.
 */

<<<<<<< HEAD
<<<<<<< HEAD
var connection = require('../../db').connect();
=======
var sequelize = require('../../models').sequelize;
>>>>>>> ad0ba79 (correction)

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
function getDataGroupedByIMEIs(from, to, callback) {

    var where = "";
    if (from && to) {
        where = "WHERE date >= '" + from + "' AND datre <= '" + to + "'";
    }

    return sequelize.query("SELECT imei, SUM(number_valid) as okCount, (SUM(number_valid) + SUM(number_invalid)) as allCount FROM gps_statistic " + where + " GROUP BY imei")
        .then(function(results, metadata) {
            callback(null, results);
        });
}



function getDataGroupedByDates(IMEI, from, to, callback) {

    var d = "";
    if (from && to) {

        d = "d.timestamp >= '" + from + "' AND d.timestamp <= '" + to + "' AND";
    }


    return connection.query(
        "SELECT okData.date, allData.allCount, COALESCE(okData.okCount, 0) as okCount " +
        "FROM " +
            "(SELECT COUNT(d.id) as allCount, date(d.timestamp) as date " +
            "FROM gps_info as d WHERE " + d + " d.imei = " + IMEI + " GROUP BY date) allData " +
        "LEFT JOIN " +
            "(SELECT COUNT(d.id) as okCount, date(d.timestamp) as date " +
            "FROM gps_info as d WHERE " + d + " d.satellites != 0 AND d.imei = " + IMEI + " GROUP BY date) okData " +
        "ON okData.date = allData.date ",
        callback
    );
}

//This function is used to get data grouped by IMEIs
module.exports.getDataGroupedByIMEIs = getDataGroupedByIMEIs;

//This function is used to get data grouped by days
module.exports.getDataGroupedByDates = getDataGroupedByDates;
>>>>>>> 5aa18a4 (corrections)
