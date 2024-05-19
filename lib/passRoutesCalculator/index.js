/**
 * Created by andranik on 7/20/15.
 */

var loader      = require('../data-loader/loader');
var loader1     = require('../data-loader');
var loader_conf = require('../../config/parameters').loader;
var sequelize = require('../models/Sequelize');

var lineNumber = 44;
var lastTimestamp = new Date('2015-07-20');

if (!loader.lines[lineNumber]){
    loader.loadLines().on(loader_conf.lines_ready_event, function(data) {
        afterLineRoutesLoad(data.lines[lineNumber]);
    })
}
else {
    afterLineRoutesLoad(loader.lines[lineNumber]);
}

/**
 * @param lineRoutes
 */
function afterLineRoutesLoad(lineRoutes)
{
    var routes = [];
    for (k in lineRoutes.routes){
        routes.push(lineRoutes.routes[k].id);
        try {
            loader1.getSectionPartsOrders(lineRoutes.routes[k].id);
        }
        catch(e) {
            console.log(e.message);
        }
    }

    setTimeout(function ()
    {
        sequelize.query("SELECT * " +
        "FROM gps_data as i " +
        "WHERE TIMESTAMPDIFF(MINUTE, '2015-07-20 14:30:00', i.timestamp) > -90 AND i.route_id IN (" + routes.join(" , ") + ") " +
        "ORDER BY i.timestamp ")
            .then(function (results) {
                results = results[0];

                for(key in results){
                    console.log(loader1.getSectionPartsOrders(results[key].route_id));
                }
            })

    }, 60000);
}

/**
TODO: Data count fo calculation

{
    123456789012345: {
        route1: {
            route_id: 8,
            start_date: '2015-07-20 12:25:15',
            end_date: '2015-07-20 13:10:13',
            start_data_count: 12,
            mean1_data_count: 15,
            mean2_data_count: 11,
            end_data_count:   9,
            end_data_count_before_timestamp: 0
        },
        route2: {
            route_id: 9,
            start_date: '2015-07-20 13:30:14',
            end_date: '2015-07-20 14:21:05',
            start_data_count: 10,
            mean1_data_count: 18,
            mean2_data_count: 13,
            end_data_count:   15,
            end_data_count_before_timestamp: 2
        }
    }
}

 */

