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

/*
 SELECT * FROM gps_data AS i WHERE i.imei = 356307044345519 AND date(i.timestamp) = '2015-06-14' ORDER BY i.timestamp;
 */

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

                var sum = 0;
                var count = 0;

                setTimeout(function() {
                    var lastItem = null;
                    for (var k = 0; k < result.length; k++){
                        var item = result[k];
                        if (lastItem && item.section_part_id == lastItem.section_part_id && lastItem.route_id == item.route_id){
                            item = lastItem;
                        }
                        else {
                            lastItem = item;
                        }

                        if (result[k + 1] && item.route_id == result[k + 1].route_id && item.section_part_id != result[k + 1].section_part_id){
                            try {
                                var stat = statistic.getTimeStatistics(item.route_id, item.section_part_id, result[k + 1].section_part_id);
                                //console.log(Math.abs(stat.passTime - (result[k + 1].timestamp - item.timestamp) / 1000), stat.passTime, (result[k + 1].timestamp - item.timestamp) / 1000);

                                sum += Math.abs(stat.passTime - (result[k + 1].timestamp - item.timestamp) / 1000);
                                count++;
                            }
                            catch(e){
                                console.log(e.message);
                            }
                        }
                    }
                }, 120000);

                console.log(sum / count);
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