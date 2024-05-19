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
module.exports.buses            = {};
module.exports.lineBuses        = {};
module.exports.statistic_mode   = null;


function loadLineBuses(lineNumber) {
    client.get(loader_conf.host + "/api/buses/" + lineNumber, function (buses){
        module.exports.lineBuses[lineNumber] = buses;
        console.log(process.pid + " PID:____" + lineNumber + " Line buses loaded");

        event.emit(loader_conf.line_buses_ready_event + "_" + lineNumber, {"lineBuses": module.exports.lineBuses[lineNumber]});
    });

    return event;
}

function loadBuses() {
    client.get(loader_conf.host + "/api/buses", function (buses){
        module.exports.buses = buses;
        console.log(process.pid + " PID:____Buses loaded");

        event.emit(loader_conf.buses_ready_event, {"buses": module.exports.buses});
    });

    return event;
}


function loadLines() {
    client.get(loader_conf.host + "/api/lines", function (lines) {
        module.exports.lines = lines;
        console.log(process.pid + " PID:____Lines loaded");

        event.emit(loader_conf.lines_ready_event, {"lines": module.exports.lines});
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
        console.log(process.pid + " PID:____" + line_number  + " Parts loaded");

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
        console.log(process.pid + " PID:____" + line_number  + " Sections loaded");

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
        console.log(process.pid + " PID:____ Statistic mode loaded " + data);

        event.emit(loader_conf.statistic_mode_ready_event, {"statisticMode": module.exports.statistic_mode});
    });

    return event;
}


function reload()
{
    loadStatisticMode();
    loadLines();
    loadBuses();

    for(var l1 in module.exports.sections){
        loadLineSections(l1);
    }

    for(var l2 in module.exports.section_parts){
        loadLineSectionParts(l2);
    }
}

//Functions to load data from rest
module.exports.loadLineSectionParts = loadLineSectionParts;
module.exports.loadLineSections     = loadLineSections;
module.exports.loadLines            = loadLines;
module.exports.loadBuses            = loadBuses;
module.exports.loadLineBuses        = loadLineBuses;
module.exports.loadStatisticMode    = loadStatisticMode;
module.exports.reload               = reload;