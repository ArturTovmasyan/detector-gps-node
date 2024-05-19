/**
 * Created by andranik on 6/22/15.
 */

var sequelize = require('../models/Sequelize');
var statistic = require('./index');
var loader    = require('../data-loader');

try {
    loader.getStatisticMode();
}
catch(e) {
    console.log(e.message);
}

var date = '2015-06-14';
var imei = 356307044345519;

sequelize.query("SELECT distinct route_id FROM gps_data AS i WHERE i.imei = " + imei + " AND date(i.timestamp) = '" + date + "'",
    {type: sequelize.QueryTypes.SELECT})
    .then(function(routeIds) {
        console.log(routeIds);
        sequelize.query("SELECT * FROM gps_data AS i WHERE i.imei = " + imei + " AND date(i.timestamp) = '" + date + "' ORDER BY i.timestamp;",
            {type: sequelize.QueryTypes.SELECT})
        .then(function(result) {

                console.log(routeIds);

                for(var key in routeIds) {
                    try {
                        loader.getSectionPartsStatistic(routeIds[key].route_id);
                    }
                    catch (e) {
                        console.log(e.message);
                    }

                    try {
                        loader.getSectionPartsOrders(routeIds[key].route_id);
                    }
                    catch (e) {
                        console.log(e.message);
                    }
                }

                setTimeout(function() {
                    for (var k in result){
                        var item = result[k];
                        if (result[k + 1] && item.route_id == result[k + 1].route_id){
                            try {
                                var stat = statistic.getTimeStatistics(item.route_id, item.section_part_id, result[k + 1].section_part_id);
                                console.log(stat);
                                console.log(result[k + 1].timestamp, item.timestamp);
                                console.log('will be: ', stat.passTime, ' be: ', (result[k + 1].timestamp - item.timestamp) / 1000);
                            }
                            catch(e){
                                console.log(e.message);
                            }
                        }
                    }
                }, 120000);
        });
    });


/*

 SELECT distinct route_id FROM gps_data AS i WHERE i.imei = 356307044345519 AND date(i.timestamp) = '2015-06-14'

select * from gps_data where id = 1088264;
  select * from gps_data as i where i.imei = 356307044345519 and i.route_id = 8 and id > 1088264 ORDER BY id LIMIT 1;


 SELECT i2.id, i2.route_id, i1.section_part_id as sp1, i2.section_part_id as sp2, i1.timestamp as t1, i2.timestamp as t2
 FROM gps_data as i2
 JOIN gps_data as i1 ON i1.id = 1088264
 WHERE i2.id > 1088264 AND i2.imei = i1.imei AND i2.route_id = i1.route_id ORDER BY id LIMIT 1

 */