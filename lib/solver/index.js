/**
 * Created by hazarapet on 3/25/15.
 */
var sizeof      = require('object-sizeof');
var loader      = require("../data-loader");
var solver_conf = require('../../config/parameters').solver;

//Load imeis with lines
loader.loadImeisWithLines();

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

var event = null;
var LAT_LNG_OF_ONE_METER = 0.000011334405372488942;

//TODO: in progress
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
    if (!section_parts && !event) {
        event = loader.loadLineSectionParts(line_number);
        throw new Error("Section parts yet didn't loaded. You can try after few minutes");
    }

    var item_distance = distanceFromStart(item.latitude, item.longitude);
    var dif_index_min = findNearestSectionPartIndexWithDistance(section_parts, item_distance - 30 * LAT_LNG_OF_ONE_METER);
    var dif_index_max = findNearestSectionPartIndexWithDistance(section_parts, item_distance + 30 * LAT_LNG_OF_ONE_METER);

    var min_distance = distance(section_parts[dif_index_min], item);
    var min_index = dif_index_min;
    for (var i = dif_index_min + 1; i <= dif_index_max; i++){
        var tmp_distance = distance(section_parts[i], item);
        if (tmp_distance < min_distance){
            min_distance = tmp_distance;
            min_index = i;
        }
    }

    if (min_distance > 30 * LAT_LNG_OF_ONE_METER){
        return section_parts[min_index];
    }

    return null;
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


module.exports.findNearestSectionPart = findNearestSectionPart;

//======================================================================================================================





///**
// * @param item
// * @param err
// * @returns {*}
// */
//function findNearestVectorpart(item, err){
//    if(!item.imei || !item.latitude || !item.longitude){
//        console.error("The item is not valid");
//        return err(new Error("The item is not valid"));
//    }
//    var line = loader.lines[item.imei];
//    var tmp_vector_parts = loader.vector_parts_by_line[line];
//    var tmp_distance = distance(item,{latitude: solver_conf.start_latitude,longitude: solver_conf.start_longitude}, null);
//    var index = 0;
//
//    for(var i = Math.floor((tmp_vector_parts.length - 1) / 2); i ; i = Math.floor((tmp_vector_parts.length - 1) / 2)){
//
//        if(tmp_distance > tmp_vector_parts[i].distance){
//            index += i;
//            tmp_vector_parts = tmp_vector_parts.slice(i, tmp_vector_parts.length);
//        }
//        else {
//            tmp_vector_parts = tmp_vector_parts.slice(0, i);
//        }
//    }
//    return {
//            vector_part: tmp_vector_parts,
//            vector_part_real_index: index,
//            temp_point_distance: tmp_distance,
//            line: line
//        };
//}
//
///**
// * @param vectorPartIndex
// * @param line
// * @param R
// * @param tempPoint
// * @returns {Array}
// */
//function findNearVectorParts(vectorPartIndex, line, R, tempPoint){
//    var vectorPartsLeft = loader.vector_parts_by_line[line].slice(0,vectorPartIndex);
//    var vectorPartsRight = loader.vector_parts_by_line[line].slice(vectorPartIndex,loader.vector_parts_by_line[line].length);
//    var nearestVectorParts = [];
//
//    for(var i = vectorPartIndex-1; i ; i--){
//        if(distance(vectorPartsLeft[i], tempPoint, null) * solver_conf.distance_coef <= R){
//            nearestVectorParts.push(vectorPartsLeft[i]);
//        }
//        else {
//            break;
//        }
//    }
//
//    for(var j = 0; j < vectorPartsRight.length; j++){
//        if(distance(vectorPartsRight[j], tempPoint, null) * solver_conf.distance_coef <= R){
//            nearestVectorParts.push(vectorPartsRight[j]);
//        }
//        else {
//            break;
//        }
//    }
//
//    return nearestVectorParts;
//}

//setTimeout(function(){
//    var tempPnt = {imei: 356307041794255, latitude: 40.161601, longitude: 44.512374};
//    var result = findNearestVectorpart(tempPnt);
//    var nearest = findNearVectorParts(result.vector_part_real_index, result.line, 20, tempPnt);
//    console.log(result.vector_part);
//},10000);