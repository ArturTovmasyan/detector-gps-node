/**
 * Created by andranik on 6/22/15.
 */

var sequelize = require('../models/Sequelize');
var statistic = require('./index');
var loader    = require('../data-loader');

var routeMinIds = {};
var routeIds    = {};

loader.getStatisticMode();

sequelize.query("select distinct route_id from gps_data where DATE(timestamp) = DATE(NOW());", {type: sequelize.QueryTypes.SELECT})
.then(function(result) {
        routeIds = result;

        var loadedCount = 0;
        for(var k in routeIds) {
            var routeId = routeIds[k].route_id;

            try {
                loader.getSectionPartsStatistic(routeId);
            }
            catch(e) {
                console.log(e.message);
            }

            try {
                loader.getSectionPartsOrders(routeId);
            }
            catch(e) {
                console.log(e.message);
            }

            sequelize.query("select MIN(id) as id, " + routeId + " as route_id FROM gps_data where DATE(timestamp) = DATE(NOW()) AND route_id = " + routeId,
                            {type: sequelize.QueryTypes.SELECT})
                .then(function(result) {
                    routeMinIds[result[0].route_id] = result[0].id;

                    loadedCount++;
                    if (loadedCount == routeIds.length){
                        setTimeout(function() {
                            startCalculate();
                        }, 120000);
                    }
                })
        }
});


var ee     = require("events").EventEmitter;
var events = {};

function startCalculate(){
    console.log(routeIds);
    for(var k in routeIds){
        var routeId = routeIds[k].route_id;
        events[routeId] = new ee();

        events[routeId].on('next', function(routeId) {
            if (routeMinIds[routeId]) {
                sequelize.query("SELECT i1.id, i1.route_id, i2.section_part_id as sp1, i1.section_part_id as sp2, i2.timestamp as t1, i1.timestamp as t2 " +
                                "FROM gps_data as i1 " +
                                "JOIN gps_data as i2 ON i2.id = " + routeMinIds[routeId] + " " +
                                "WHERE i1.id > " + routeMinIds[routeId] + " ORDER BY id LIMIT 1",
                                {type: sequelize.QueryTypes.SELECT})
                    .then(function (result) {
                        try {
                            var stat = statistic.getTimeStatistics(result[0].route_id, result[0].sp1, result[0].sp2);
                            console.log(result[0].sp1, ' to ', result[0].sp2, ' date from ', result[0].t2, ' to ', result[0].t1);
                            console.log('will be: ', stat.passTime, ' be: ', (result[0].t2 - result[0].t1) / 1000);
                        }
                        catch(e) {
                            console.log('calculate: ', e.message);
                        }

                        routeMinIds[routeId] = result[0].id;
                        events[routeId].emit('next', routeId);
                    });
            }
        });

        events[routeId].emit('next', routeId);
    }
}
