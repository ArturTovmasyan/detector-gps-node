var loader      = require("./dataResponsible");
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

/**
 * This function is used to find nearest section part by given gps data
 *
 * @param item
 * @returns {*}
 */
function findNearestSectionPart(item){

    if(!item.imei || !item.latitude || !item.longitude){
        console.error("The item is not valid");
        throw new Error("The item is not valid");
    }

    var line_number   = loader.findLineByImei(item.imei);
    var section_parts = loader.findSectionPartsByLine(line_number);


    var item_distance = distanceFromStart(item.latitude, item.longitude);
    var dif_index_min = findNearestSectionPartIndexWithDistance(section_parts, item_distance - solver_conf.ALLOW_DEVIATION_BY_METERS * solver_conf.LAT_LNG_OF_ONE_METER);
    var dif_index_max = findNearestSectionPartIndexWithDistance(section_parts, item_distance + solver_conf.ALLOW_DEVIATION_BY_METERS * solver_conf.LAT_LNG_OF_ONE_METER);

    var min_distance = distance(section_parts[dif_index_min], item);
    var min_index = dif_index_min;
    for (var i = dif_index_min + 1; i <= dif_index_max; i++){
        var tmp_distance = distance(section_parts[i], item);
        if (tmp_distance < min_distance){
            min_distance = tmp_distance;
            min_index = i;
        }
    }

    if (min_distance > solver_conf.ALLOW_DEVIATION_BY_METERS * solver_conf.LAT_LNG_OF_ONE_METER){
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
    var min_dif_index = current_index;
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
            min_dif_index = current_index;
        }
    }

    return min_dif_index;
}


module.exports.findNearestSectionPart = findNearestSectionPart;