var loader = require("../data-loader");

//======================================================================================================================

lines_event = null;

/**
 * @param line_number
 * @returns {null|*}
 */
function findLineRouteIds(line_number){

    var line = loader.lines[line_number];
    //If line's section parts didn't loaded then start to load and return error with corresponding message
    if (!line && !lines_event) {
        lines_event = loader.loadLines();
        throw new Error("Lines yet didn't loaded. You can try after few minutes");
    }

    var routeIds = [];
    line.routes.forEach(function (route) {
        routeIds.push(route.id);
    });

    return routeIds;
}

module.exports.findLineRouteIds = findLineRouteIds;

//======================================================================================================================

imei_lines_event = null;

/**
 * @param imei
 * @returns {*}
 */
function findLineByImei(imei){

    //If lines didn't loaded then return error with corresponding message
    if (loader.imeis && !imei_lines_event) {
        //Load imeis with lines
        imei_lines_event = loader.loadImeisWithLines();
        throw new Error("Imei lines yet didn't loaded. You can try after few minutes");
    }

    var line_number = loader.imeis[imei];
    //If line for given imei don't find throw exception
    if (!line_number) {
        throw new Error(imei + " lines don't found");
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
    if (!section_parts && !section_part_event) {
        section_part_event = loader.loadLineSectionParts(line_number);
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
    if (!sections && !section_event) {
        section_event = loader.loadLineSections(line_number);
        throw new Error("Section parts yet didn't loaded. You can try after few minutes");
    }

    return sections;
}

module.exports.findSectionsByLine = findSectionsByLine;