/**
 * Created by andranik on 6/22/15.
 */

var sequelize = require('../models/Sequelize');
var statistic = require('./index');
var loader    = require('../data-loader');

var routeMinIds = {};
var routeIds    = {};

try {
    loader.getStatisticMode();
}
catch(e) {
    console.log(e.message);
}

var date = new Date();
var imei = 356307044345519;


sequelize.query("select * from gps_data as i where i.imei = " + imei + " and date(i.timestamp) = DATE(" + date + ") order by i.timestamp;",
    {type: sequelize.QueryTypes.SELECT})
.then(function(result) {
        console.log(result);

        //routeIds = result;
        //
        //var loadedCount = 0;
        //for(var k in routeIds) {
        //    var routeId = routeIds[k].route_id;
        //
        //    try {
        //        loader.getSectionPartsStatistic(routeId);
        //    }
        //    catch (e) {
        //        console.log(e.message);
        //    }
        //
        //    try {
        //        loader.getSectionPartsOrders(routeId);
        //    }
        //    catch (e) {
        //        console.log(e.message);
        //    }
        //
        //    sequelize.query("select MIN(id) as id, " + routeId + " as route_id FROM gps_data where DATE(timestamp) = DATE(NOW()) AND route_id = " + routeId,
        //        {type: sequelize.QueryTypes.SELECT})
        //        .then(function (result) {
        //            routeMinIds[result[0].route_id] = result[0].id;
        //
        //            loadedCount++;
        //            if (loadedCount == routeIds.length) {
        //                setTimeout(function() {
        //                    startCalculate();
        //                }, 120000);
        //            }
        //        })
        //}
});

/*

select * from gps_data where id = 1088264;
  select * from gps_data as i where i.imei = 356307044345519 and i.route_id = 8 and id > 1088264 ORDER BY id LIMIT 1;


 SELECT i2.id, i2.route_id, i1.section_part_id as sp1, i2.section_part_id as sp2, i1.timestamp as t1, i2.timestamp as t2
 FROM gps_data as i2
 JOIN gps_data as i1 ON i1.id = 1088264
 WHERE i2.id > 1088264 AND i2.imei = i1.imei AND i2.route_id = i1.route_id ORDER BY id LIMIT 1

 */