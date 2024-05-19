/**
 * Created by andranik on 3/11/15.
 */

var Client           = require('node-rest-client').Client;
var ee               = require("events").EventEmitter;
var loader_conf      = require('../../config/parameters').loader;

var event = new ee();
var client = new Client();

//====================================================================


//Variables which collect datas
module.exports.lines            = {};
module.exports.imeis            = {};
module.exports.section_parts    = {};
module.exports.sections         = {};
module.exports.statistic_mode   = null;



function loadLines() {
    client.get(loader_conf.host + "/api/lines", function (lines) {
        module.exports.lines = lines;

        event.emit(loader_conf.lines_ready_event, {"lines": module.exports.lines});
    });

    return event;
}

/**
 * @returns {ee}
 */
function loadImeisWithLines() {
    client.get(loader_conf.host + "/api/lines/with/imei", function (imeis) {
        imeis.forEach(function(imei) {
            module.exports.imeis[imei.imei] = imei.number;
        });

        event.emit(loader_conf.lines_ready_event, {"imeis": module.exports.imeis});
    });

    return event;
}

/**
 * @param line_number
 * @returns {ee}
 */
function loadLineSectionParts(line_number) {
    client.get(loader_conf.host + "/api/lines/" + line_number + "/parts", function (data) {
        module.exports.section_parts[line_number] = data;

        event.emit(loader_conf.line_section_parts_ready_event, {"line_section_parts": module.exports.section_parts[line_number]});
    });

    return event;
}

/**
 * @param line_number
 * @returns {ee}
 */
function loadLineSections(line_number) {
    client.get(loader_conf.host + "/api/lines/" + line_number + "/sections", function (data) {
        module.exports.sections[line_number] = data;

        event.emit(loader_conf.line_sections_ready_event, {"line_sections": module.exports.sections[line_number]});
    });

    return event;
}

/**
 * @returns {ee}
 */
function loadStatisticMode() {
    client.get(loader_conf.host + "/api/statistics/mode", function (data) {
        module.exports.statistic_mode = data;

        event.emit(loader_conf.statistic_mode_ready_event, {"statisticMode": module.exports.statistic_mode});
    });

    return event;
}

//Functions to load data from rest
module.exports.loadImeisWithLines   = loadImeisWithLines;
module.exports.loadLineSectionParts = loadLineSectionParts;
module.exports.loadLineSections     = loadLineSections;
module.exports.loadLines            = loadLines;
module.exports.loadStatisticMode    = loadStatisticMode;


//====================================================================




















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