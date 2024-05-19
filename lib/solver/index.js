/**
 * Created by hazarapet on 3/25/15.
 */
var sizeof      = require('object-sizeof');
var loader      = require("../data-loader");
var solver_conf = require('../../config/parameters').solver;

/**
 * @param point1
 * @param point2
 * @returns {*}
 */
function distance(point1, point2){
    if(!point1 || !point2 ||
       !point1.latitude || !point1.longitude ||
       !point2.latitude || !point2.longitude){
        console.error("The points are not valid");
        return new Error("The points are not valid");
    }
    return Math.sqrt(Math.pow(point1.latitude - point2.latitude, 2) + Math.pow(point1.longitude - point2.longitude, 2));
}

/**
 * @param latitude
 * @param longitude
 * @returns {*}
 */
function distanceFromStart(latitude, longitude) {
    return distance({"latitude": latitude, "longitude": longitude}, {latitude: solver_conf.start_latitude,longitude: solver_conf.start_longitude});
}


//======================================================================================================================

//Load imeis with lines
loader.loadImeisWithLines();

var section_part_event        = null;
var LAT_LNG_OF_ONE_METER      = 0.000011334405372488942;
var ALLOW_DEVIATION_BY_METERS = 30;

function findNearestSectionPart(item){
    if(!item.imei || !item.latitude || !item.longitude){
        console.error("The item is not valid");
        throw new Error("The item is not valid");
    }

    //TODO: need to uncomment after imeis correction from database
    var line_number = 47;//loader.imeis[item.imei];
    //If lines didn't loaded then return error with corresponding message
    if (!line_number) {
        throw new Error("Lines yet didn't loaded. You can try after few minutes");
    }

    var section_parts = loader.section_parts[line_number];
    //If line's section parts didn't loaded then start to load and return error with corresponding message
    if (!section_parts && !section_part_event) {
        section_part_event = loader.loadLineSectionParts(line_number);
        throw new Error("Section parts yet didn't loaded. You can try after few minutes");
    }

    var item_distance = distanceFromStart(item.latitude, item.longitude);
    var dif_index_min = findNearestSectionPartIndexWithDistance(section_parts, item_distance - ALLOW_DEVIATION_BY_METERS * LAT_LNG_OF_ONE_METER);
    var dif_index_max = findNearestSectionPartIndexWithDistance(section_parts, item_distance + ALLOW_DEVIATION_BY_METERS * LAT_LNG_OF_ONE_METER);

    var min_distance = distance(section_parts[dif_index_min], item);
    var min_index = dif_index_min;
    for (var i = dif_index_min + 1; i <= dif_index_max; i++){
        var tmp_distance = distance(section_parts[i], item);
        if (tmp_distance < min_distance){
            min_distance = tmp_distance;
            min_index = i;
        }
    }

    if (min_distance > ALLOW_DEVIATION_BY_METERS * LAT_LNG_OF_ONE_METER){
        return null;
    }

    return section_parts[min_index];
}

/**
 * This function is used to find nearest section part index with given distance
 *
 * @param section_parts
 * @param item_distance
 * @returns {number}
 */
function findNearestSectionPartIndexWithDistance(section_parts, item_distance)
{
    var current_index = Math.floor(section_parts.length / 2);
    var tmp_difference = Math.abs(item_distance - section_parts[current_index].distance_from_start);
    var dif_index = current_index;
    var length = Math.floor(section_parts.length / 2);

    while(length) {

        if (item_distance > section_parts[current_index].distance_from_start) {
            length = Math.floor(Math.abs(length) / 2);
        }
        else {
            length = - Math.floor(Math.abs(length) / 2);
        }

        current_index += length;
        if (Math.abs(item_distance - section_parts[current_index].distance_from_start) < tmp_difference){
            tmp_difference = Math.abs(item_distance - section_parts[current_index].distance_from_start);
            dif_index = current_index;
        }
    }

    return dif_index;
}

var section_event = null;
var routeSectionOrder = {};

function findBusRoute(imei, sectionId)
{
    //TODO: need to uncomment after imeis correction from database
    var line_number = 47;//loader.imeis[item.imei];
    //If lines didn't loaded then return error with corresponding message
    if (!line_number) {
        throw new Error("Lines yet didn't loaded. You can try after few minutes");
    }

    var sections = loader.sections[line_number];
    //If line's section parts didn't loaded then start to load and return error with corresponding message
    if (!sections && !section_event) {
        section_event = loader.loadLineSections(line_number);
        throw new Error("Section parts yet didn't loaded. You can try after few minutes");
    }

    if (!routeSectionOrder[imei]) {
        routeSectionOrder[imei] = {};
    }

    sections[sectionId].route_section.forEach(function (routeSection) {

        if (!Array.isArray( routeSectionOrder[imei][routeSection.route.id] )) {
            routeSectionOrder[imei][routeSection.route.id] = [];
        }

        if (routeSectionOrder[imei][routeSection.route.id].indexOf(routeSection.order) == -1) {
            routeSectionOrder[imei][routeSection.route.id].push(routeSection.order);
        }

        if (routeSectionOrder[imei][routeSection.route.id].length > 10) {
            routeSectionOrder[imei][routeSection.route.id].shift();
        }
    });
}

module.exports.routeSectionOrder = routeSectionOrder;
module.exports.findBusRoute = findBusRoute;

module.exports.findNearestSectionPart = findNearestSectionPart;