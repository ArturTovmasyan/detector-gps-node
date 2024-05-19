/**
 * Created by hazarapet on 3/25/15.
 */
var sizeof      = require('object-sizeof');
var loader      = require("../data-loader");
var solver_conf = require('../../config/parameters').solver;


loader.load_vector_parts();

/**
 * @param point1
 * @param point2
 * @param err
 * @returns {*}
 */
function distance(point1, point2, err){
    if(!point1 || !point2 ||
       !point1.latitude || !point1.longitude ||
       !point2.latitude || !point2.longitude){
        return err(new Error("The points are not valid"))
    }
    return Math.sqrt(Math.pow(point1.latitude-point2.latitude,2)+Math.pow(point1.longitude-point2.longitude,2));
}

/**
 * @param item
 * @param err
 * @returns {*}
 */
function findNearestVectorpart(item, err){
    if(!item.imei){
        return err(new Error("The item has not imei"));
    }
    var line = loader.lines[item.imei];
    var tmp_vector_parts = loader.vector_parts_by_line[line];
    var tmp_distance = Math.sqrt(Math.pow(item.latitude - solver_conf.start_latitude, 2) +
                                 Math.pow(item.longitude - solver_conf.start_longitude, 2));
    var index = 0;

    for(var i = Math.floor((tmp_vector_parts.length - 1) / 2); i ; i = Math.floor((tmp_vector_parts.length - 1) / 2)){

        if(tmp_distance > tmp_vector_parts[i].distance){
            index += i;
            tmp_vector_parts = tmp_vector_parts.slice(i, tmp_vector_parts.length);
        }
        else {
            tmp_vector_parts = tmp_vector_parts.slice(0, i);
        }
    }
    return {
            vector_part: tmp_vector_parts,
            vector_part_real_index: index,
            temp_point_distance: tmp_distance
        };
}

setTimeout(function(){
    var result = findNearestVectorpart({imei: 356307041794255, latitude: 40.187175, longitude: 44.515129});
    console.log(result);
},10000);

