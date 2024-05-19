var loader = require("./loader");


//======================================================================================================================

buses_event = null;

/**
 * @param imei
 * @returns {*}
 */
function findBusByImei(imei){

    var bus = loader.buses[imei];

    if (!bus) {
        if (!buses_event) {
            buses_event = loader.loadBuses();
        }
        throw new Error("Buses yet didn't loaded. You can try after few minutes");
    }

    return bus;
}

module.exports.findBusByImei = findBusByImei;


//======================================================================================================================

/**
 * @param imei
 * @returns {*}
 */
function findLineByImei(imei){

    var line_number = loader.buses[imei] ? loader.buses[imei].line_number : null;
    //If lines didn't loaded then return error with corresponding message
    if (!line_number) {
        if (!buses_event) {
            buses_event = loader.loadBuses();
        }
        throw new Error("Imei lines yet didn't loaded, or line with " + imei + " imei not found. You can try after few minutes");
    }

    return line_number;
}

module.exports.findLineByImei = findLineByImei;


//======================================================================================================================

/**
 * @param imei
 * @returns {*}
 */
function findBuses(){

    if (!loader.buses) {
        if (!buses_event) {
            buses_event = loader.loadBuses();
        }
        throw new Error("Buses yet didn't loaded. You can try after few minutes");
    }

    return loader.buses;
}

module.exports.findBuses = findBuses;

//======================================================================================================================

lines_event = null;

/**
 * @param line_number
 * @returns {null|*}
 */
function findLineRoutes(line_number){

    var line = loader.lines[line_number];
    //If line's section parts didn't loaded then start to load and return error with corresponding message
    if (!line) {
        if (!lines_event) {
            lines_event = loader.loadLines();
        }
        throw new Error("Lines yet didn't loaded. You can try after few minutes");
    }

    return line.routes;
}

module.exports.findLineRoutes = findLineRoutes;

//======================================================================================================================

var section_part_event = [];

/**
 * @param line_number
 * @returns {*}
 */
function findSectionPartsByLine(line_number){

    var section_parts = loader.section_parts[line_number];
    //If line's section parts didn't loaded then start to load and return error with corresponding message
    if (!section_parts) {
        if (!section_part_event[line_number]) {
            section_part_event[line_number] = loader.loadLineSectionParts(line_number);
        }
        throw new Error(line_number + " section_parts yet didn't loaded. You can try after few minutes");
    }

    return section_parts;
}

module.exports.findSectionPartsByLine = findSectionPartsByLine;

//======================================================================================================================

section_event = [];

/**
 * @param line_number
 * @returns {*}
 */
function findSectionsByLine(line_number){

    var sections = loader.sections[line_number];
    //If line's section parts didn't loaded then start to load and return error with corresponding message
    if (!sections) {
        if (!section_event[line_number]) {
            section_event[line_number] = loader.loadLineSections(line_number);
        }
        throw new Error(line_number + " section yet didn't loaded. You can try after few minutes");
    }

    return sections;
}

module.exports.findSectionsByLine = findSectionsByLine;

//======================================================================================================================

var statistic_mode_event = null;

/**
 * @returns {*}
 */
function getStatisticMode()
{
    //TODO: save last time to change mode
    //If line's section parts didn't loaded then start to load and return error with corresponding message
    if (!loader.statistic_mode) {
        if (!statistic_mode_event) {
            statistic_mode_event = loader.loadStatisticMode();
        }
        throw new Error("Statistic mode yet didn't loaded. You can try after few minutes");
    }

    return loader.statistic_mode;
}

module.exports.getStatisticMode = getStatisticMode;
