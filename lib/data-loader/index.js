var loader = require("./loader");

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

imei_lines_event = null;

/**
 * @param imei
 * @returns {*}
 */
function findLineByImei(imei){

    var line_number = loader.imeis[imei];
    //If lines didn't loaded then return error with corresponding message
    if (!line_number) {
        if (!imei_lines_event) {
            imei_lines_event = loader.loadImeisWithLines();
        }
        throw new Error("Imei lines yet didn't loaded, or line with " + imei + " imei not found. You can try after few minutes");
    }

    return line_number;
}

module.exports.findLineByImei = findLineByImei;

//======================================================================================================================

var section_part_event = null;

/**
 * @param line_number
 * @returns {*}
 */
function findSectionPartsByLine(line_number){

    var section_parts = loader.section_parts[line_number];
    //If line's section parts didn't loaded then start to load and return error with corresponding message
    if (!section_parts) {
        if (!section_part_event) {
            section_part_event = loader.loadLineSectionParts(line_number);
        }
        throw new Error("Section parts yet didn't loaded. You can try after few minutes");
    }

    return section_parts;
}

module.exports.findSectionPartsByLine = findSectionPartsByLine;

//======================================================================================================================

section_event = null;

/**
 * @param line_number
 * @returns {*}
 */
function findSectionsByLine(line_number){

    var sections = loader.sections[line_number];
    //If line's section parts didn't loaded then start to load and return error with corresponding message
    if (!sections) {
        if (!section_event) {
            section_event = loader.loadLineSections(line_number);
        }
        throw new Error("Section parts yet didn't loaded. You can try after few minutes");
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
