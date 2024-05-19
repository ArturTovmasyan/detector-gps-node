/**
 * Created by hazarapet on 3/25/15.
 */

var loader      = require("../data_loader");
var loader_conf = require('../../config/parameters').loader;

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

loader.get_lines();

setTimeout(function(){
    console.log(loader);
},600);