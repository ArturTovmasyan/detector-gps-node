/**
 * Created by andranik on 3/16/15.
 */

var sequelize = require('../../models/Sequelize');

/**
 * This function is used to get statistic data grouped by IMEI
 * @param from
 * @param to
 * @param callback
 * @returns {*|Bluebird.Promise}
 */
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
