/**
 * Created by andranik on 6/22/15.
 */

var sequelize = require('../models/Sequelize');
var statistic = require('./index');
var loader    = require('../data-loader');

sequelize.query("select distinct route_id from gps_data where DATE(timestamp) = DATE(NOW());", {type: sequelize.QueryTypes.SELECT})
.then(function(routeIds) {
        var routeMinIds = {};
        var loadedCount = 0;

        for(var k in routeIds) {
            var routeId = routeIds[k].route_id;
            loader.getSectionPartsStatistic(routeId);
            loader.getSectionPartsOrders(routeId);

            sequelize.query("select MIN(id) as id, " + routeId + " as route_id FROM gps_data where DATE(timestamp) = DATE(NOW()) AND route_id = " + routeId, {type: sequelize.QueryTypes.SELECT})
                .then(function(result) {
                    routeMinIds[result[0].route_id] = result[0].id;
                    loadedCount++;

                    if (loadedCount == result[0].route_id){
                        console.log(routeMinIds);
                    }
                })
        }

});


//sequelize.query("select MIN(id) FROM gps_data where DATE(timestamp) = DATE(NOW());", {type: sequelize.QueryTypes.SELECT})
//.then(function (minId) {
//    for(var k in results) {
//        var result = results[k];
//        var stat = statistic.getTimeStatistics(result.route_id, result.section_part_id1, result.section_part_id2);
//        console.log('will be: ', stat.passTime, ' be: ', result.t2 - result.t1);
//    }
//});

/*
SELECT i1.imei, i1.id, i1.timestamp, i2.id, i2.timestamp FROM gps_data as i1
JOIN gps_data as i2 ON DATE(i2.timestamp) = DATE(NOW()) AND i1.route_id = i2.route_id AND i1.imei = i2.imei AND i2.timestamp > i1.timestamp
AND NOT EXISTS (SELECT * FROM gps_data as i3 WHERE i3.timestamp > i1.timestamp and i3.timestamp < i2.timestamp and i3.imei = i1.imei)
WHERE DATE(i1.timestamp) = DATE(NOW());

*/