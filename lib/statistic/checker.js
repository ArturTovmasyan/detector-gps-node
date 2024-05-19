/**
 * Created by andranik on 6/22/15.
 */

var sequelize    = require('../models/Sequelize');
var statistic    = require('./index');
var loader       = require('../data-loader');
var rawLoader    = require('../data-loader/loader');
var loader_conf  = require('../../config/parameters').loader;

try {
    loader.getStatisticMode();
}
catch(e) {
    console.log(e.message);
}

var lineNumber   = process.argv[2];//47;
var date         = process.argv[3];//'2015-06-14';
var allSum       = 0;
var allSumCoeff  = 0;
var allCount     = 0;

var busCount     = 0;


rawLoader.loadLineBuses(lineNumber)
.on(loader_conf.line_buses_ready_event + "_" + lineNumber, function(data) {
    var lineBuses = data.lineBuses;
    sequelize.query(" SELECT r.id as route_id FROM line as l JOIN route as r ON r.line_id = l.id WHERE l.number = " + lineNumber,
        {type: sequelize.QueryTypes.SELECT})
        .then(function(routeIds) {
            console.log(routeIds);
            //Load route's statistics
            for(var key in routeIds) {
                try {
                    loader.getSectionPartsStatistic(routeIds[key].route_id, true);
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
                for(var imei in lineBuses) {

                    sequelize.query("SELECT i.imei, i.route_id, i.timestamp, i.section_part_id, ssp.stop_id " +
                        "FROM gps_data AS i " +
                        "JOIN section_part as sp ON sp.id = i.section_part_id " +
                        "LEFT JOIN stop_section_part as ssp ON ssp.section_part_id = sp.id " +
                        "WHERE i.imei = " + imei + " AND date(i.timestamp) = '" + date + "' " +
                        "ORDER BY i.timestamp;",
                        {type: sequelize.QueryTypes.SELECT})
                        .then(function (result) {

                            if (result.length) {
                                var coeff     = 1;
                                var firstItem = null;
                                var sum       = 0;
                                var sumCoeff  = 0;
                                var count     = 0;
                                var passedStops = {};

                                for (var k = 0; k < result.length; k++) {
                                    var item = result[k];

                                    if (!firstItem || firstItem.route_id != item.route_id /*|| (item.timestamp - firstItem.timestamp) / 1000 > 1800*/){
                                        firstItem = item;
                                        passedStops = {};
                                    }

                                    if (firstItem != item && item.stop_id && !passedStops[item.stop_id]) {
                                        passedStops[item.stop_id] = 1;

                                        try {
                                            var stat      = statistic.getTimeStatistics(item.route_id, firstItem.section_part_id, item.section_part_id, 1, true);
                                            var statCoeff = statistic.getTimeStatistics(item.route_id, firstItem.section_part_id, item.section_part_id, coeff, true);

                                            sumCoeff += Math.abs(statCoeff.passTime - (item.timestamp - firstItem.timestamp) / 1000);
                                            sum      += Math.abs(stat.passTime - (item.timestamp - firstItem.timestamp) / 1000);
                                            count++;

                                            coeff = ((item.timestamp - firstItem.timestamp) / 1000) / stat.passTime;
                                            if (!coeff || coeff == Infinity) {
                                                coeff = 1;
                                            }
                                        }
                                        catch (e) {
                                            //console.log(e.message);
                                        }
                                    }
                                }

                                console.log('____________ IMEI: ', result[0].imei, " Raw diff: ", sum / count, " Coeff diff: ", sumCoeff / count);

                                allSum += sum / count;
                                allSumCoeff += sumCoeff / count;
                                allCount++;
                            }

                            busCount++;
                            if (busCount == Object.keys(lineBuses).length) {
                                console.log('all: ', allSum / allCount, 'all coeff: ', allSumCoeff / allCount);
                            }
                        });
                }

            }, 60000);
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


 SELECT i.imei, i.route_id, i.timestamp, i.section_part_id, ssp.stop_id
 FROM gps_data AS i
 JOIN section_part as sp ON sp.id = i.section_part_id
 LEFT JOIN stop_section_part as ssp ON ssp.section_part_id = sp.id
 WHERE i.imei = 356307042484658 AND date(i.timestamp) = '2015-07-09'
 ORDER BY i.timestamp;


 */