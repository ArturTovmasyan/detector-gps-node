/**
 * Created by hazarapet on 3/25/15.
 */
var sizeof      = require('object-sizeof');
var loader      = require("../data_loader");
var loader_conf = require('../../config/parameters').loader;

loader.get_lines();

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
function findNearestVectorparts(item, err){
    if(!item.imei){
        return err(new Error("The item has not imei"));
    }
    var line = loader.lines[item.imei];
    var event = loader.get_vector_parts_by_line(line);

    event.on(loader_conf.vector_parts_ready_event,function(msg){
        console.log(sizeof(loader.vector_parts_by_line));
    })
}

setTimeout(function(){
    findNearestVectorparts({imei: 356307041794255, latitude: 40.187175, longitude: 44.515129});
},600);
