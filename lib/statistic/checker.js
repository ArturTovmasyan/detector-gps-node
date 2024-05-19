/**
 * Created by andranik on 6/22/15.
 */

var sequelize    = require('../models/Sequelize');
var statistic    = require('./index');
var loader       = require('../data-loader');
var rawLoader    = require('../data-loader/loader');
var loader_conf  = require('../../config/parameters').loader;
var ee           = require("events").EventEmitter;


function calculateLineForecastingErrors(lineNumber, date, disableLogging) {

    var event = new ee();

    //TODO: need for better solution
    try {
        loader.getStatisticMode();
    }
    catch(e) {
        //console.log(e.message);
    }

    var allSum       = 0;
    var allSumCoeff  = 0;
    var allCount     = 0;
    var busCount     = 0;

    rawLoader.loadLineBuses(lineNumber)
        .on(loader_conf.line_buses_ready_event + "_" + lineNumber, function (data) {
            var lineBuses = data.lineBuses;
            sequelize.query(" SELECT r.id as route_id FROM line as l JOIN route as r ON r.line_id = l.id WHERE l.number = " + lineNumber,
                {type: sequelize.QueryTypes.SELECT})
                .then(function (routeIds) {
                    //Load route's statistics
                    for (var key in routeIds) {
                        try {
                            loader.getSectionPartsStatistic(routeIds[key].route_id, true);
                        }
                        catch (e) {
                            //console.log(e.message);
                        }

                        try {
                            loader.getSectionPartsOrders(routeIds[key].route_id);
                        }
                        catch (e) {
                            //console.log(e.message);
                        }
                    }

                    setTimeout(function () {
                        for (var imei in lineBuses) {

                            sequelize.query("SELECT i.imei, i.route_id, i.timestamp, i.section_part_id, ssp.stop_id " +
                                "FROM gps_data AS i " +
                                "JOIN section_part as sp ON sp.id = i.section_part_id " +
                                "LEFT JOIN stop_section_part as ssp ON ssp.section_part_id = sp.id " +
                                "WHERE i.imei = " + imei + " AND date(i.timestamp) = '" + date + "' " +
                                "ORDER BY i.timestamp;",
                                {type: sequelize.QueryTypes.SELECT})
                                .then(function (result) {

                                    if (result.length) {
                                        var coeff = 1;
                                        var firstItem = null;
                                        var sum = 0;
                                        var sumCoeff = 0;
                                        var count = 0;
                                        var passedStops = {};

                                        for (var k = 0; k < result.length; k++) {
                                            var item = result[k];

                                            if (!firstItem || firstItem.route_id != item.route_id || (item.timestamp - firstItem.timestamp) / 1000 > 600) {
                                                firstItem = item;
                                                passedStops = {};
                                            }

                                            if (firstItem != item && item.stop_id && !passedStops[item.stop_id]) {
                                                passedStops[item.stop_id] = 1;

                                                try {
                                                    var stat = statistic.getTimeStatistics(item.route_id, firstItem.section_part_id, item.section_part_id, 1, true);
                                                    var statCoeff = statistic.getTimeStatistics(item.route_id, firstItem.section_part_id, item.section_part_id, coeff, true);

                                                    sumCoeff += Math.abs(statCoeff.passTime - (item.timestamp - firstItem.timestamp) / 1000);
                                                    sum += Math.abs(stat.passTime - (item.timestamp - firstItem.timestamp) / 1000);
                                                    count++;

                                                    coeff = ((item.timestamp - firstItem.timestamp) / 1000) / stat.passTime;
                                                    if (!coeff || coeff == Infinity) {
                                                        coeff = 1;
                                                    }
                                                }
                                                catch (e) {
                                                    //console.log(e.message);
                                                }
                                            }
                                        }

                                        if (!disableLogging) {
                                            console.log('____________ IMEI: ', result[0].imei, " Raw diff: ", sum / count, " Coeff diff: ", sumCoeff / count);
                                        }

                                        allSum += sum / count;
                                        allSumCoeff += sumCoeff / count;
                                        allCount++;
                                    }

                                    busCount++;
                                    if (busCount == Object.keys(lineBuses).length){
                                        event.emit('ForecastingError_' + lineNumber, {lineNumber: lineNumber, date: date, alg1: allSum / allCount, alg2: allSumCoeff / allCount});
                                        if (!disableLogging) {
                                            console.log('all: ', allSum / allCount, 'all coeff: ', allSumCoeff / allCount);
                                        }
                                    }
                                });
                        }

                    }, 60000);
                });
        });

    return event;
}


var ForecastingError = require('../models').ForecastingError;

function calculateAllForecastingErrors(saveInDatabase, date)
{
    var d = date;
    //TODO: need for better solution
    try {
        loader.getStatisticMode();
    }
    catch(e) {
        //console.log(e.message);
    }

    rawLoader.loadLines().on(loader_conf.lines_ready_event, function(data){
        lines = data.lines;

        for(var line in lines){
            var date = d ? new Date(d) : new Date();
            calculateLineForecastingErrors(line, date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(), true)
                .on('ForecastingError_' + line, function(data){
                    if (saveInDatabase){
                        if (data.lineNumber && data.date && data.alg1 && data.alg2) {
                            ForecastingError.create({
                                line_number: data.lineNumber,
                                date:        data.date,
                                alg1_error:  data.alg1,
                                alg2_error:  data.alg2
                            });
                        }
                    }
                    else {
                        console.log('lineNumber: ', data.lineNumber, ' date: ', data.date, ' alg1: ', data.alg1, ' alg2: ', data.alg2);
                    }
                });
        }
    });
}


/**
 * @constructor
 */
function DisplayAllForecastingErrors($argv){
    calculateAllForecastingErrors(false, $argv[0]);
}

/**
 * @constructor
 */
function SaveAllForecastingErrors(){
    calculateAllForecastingErrors(true);
}

/**
 * @param $argv
 * @constructor
 */
function LineForecastingErrors($argv){
    calculateLineForecastingErrors($argv[0], $argv[1]);
}



module.exports.calculateAllForecastingErrors = calculateAllForecastingErrors;


module.exports.commands = {
    'save:forecasting:errors': {
        "run": SaveAllForecastingErrors,
        description: "This command is used to save all forecasting errors in the table"
    },
    'display:forecasting:errors': {
        "run": DisplayAllForecastingErrors,
        description: "This command is used to display all forecasting errors"
    },
    'display:line:forecasting:errors': {
        "run": LineForecastingErrors,
        description: "This command is used to calculate line forecasting errors"
    }
};