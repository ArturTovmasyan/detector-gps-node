/**
 * Created by andranik on 3/11/15.
 */

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var log     = require('./lib/logger');
var api     = require('./lib/api-controller');
var gps     = require('./lib/gps-controller');
var loader  = require('./lib/data-loader');
var param   = require('./config/parameters');
var solver  = require('./lib/solver');

var viewControl = require('./lib/view-controller');
var io          = viewControl.get_socket();



if (cluster.isMaster) {

    var workers = [];
    //Object to collect all fresh data from gps
    var currentBusPositions = {};

    for (var i = 0; i < numCPUs; i++) {
        workers[i] = cluster.fork();

        workers[i].on('message', function(msg) {
            if (msg.busInfo) {
                if (!currentBusPositions[msg.busInfo.gpsData.imei] || currentBusPositions[msg.busInfo.gpsData.imei].gpsData.timestamp < msg.busInfo.gpsData.timestamp)
                {
                    currentBusPositions[msg.busInfo.gpsData.imei] = msg.busInfo;

                    io.send({busInfo: msg.busInfo});
                }
            }
        });
    }

    setInterval(function(){
        for(var imei in currentBusPositions){
            busInfo = currentBusPositions[imei];
            var currentDate = new Date();
            if (((currentDate - busInfo.gpsData.timestamp) / 60000) > 10){
                busInfo.busStatus = 'no_data'
            }
        }
    }, 600000);

    viewControl.express_start(param.express.stop_port);

    //Start listen on 8000 port for incoming api requests
    var apiEmitter = api.start(param.api_controller.port);

    //listen for incoming commands
    apiEmitter.on('load_buses', function() {
        workers.forEach(function(worker) {
            worker.send({load_buses: true});
        })
    });
    apiEmitter.on('load_routes', function() {
        workers.forEach(function(worker) {
            worker.send({load_routes: true});
        })
    });
}
else {

    //Load data to start a work
    var buses = loader.getBusesSync();
    var routes = loader.getRoutesSync();

    //check data from parent and do corresponding actions
    process.on('message', function (msg) {
        if (msg.load_buses) {
            loader.getBuses(function (err, data) {
                buses = data;
                console.log('_____buses_loaded_____ process id:' + process.pid);
            });
        }
        if (msg.load_routes) {
            loader.getRoutes(function (err, data) {
                routes = data;
                console.log('_____routes_loaded_____ process id:' + process.pid);
            });
        }
    });

    var dataListener = solver.start();

    dataListener.on('data', function(busInfo) {
        process.send({busInfo: busInfo});
    });
}



/*

 SELECT i1.section_part_id as fromSectionPart, (SELECT i2.section_part_id
 FROM bus_nodejs.gps_info as i2
 WHERE i1.imei = i2.imei AND i2.timestamp > i1.timestamp AND i1.route_id = i2.route_id ORDER BY i2.timestamp ASC LIMIT 1) as toSectionPart,
 i1.route_id,
 (SELECT i2.timestamp
 FROM bus_nodejs.gps_info as i2
 WHERE i1.imei = i2.imei AND i2.timestamp > i1.timestamp AND i1.route_id = i2.route_id ORDER BY i2.timestamp ASC LIMIT 1) as timestamp

 FROM bus_nodejs.gps_info as i1
 WHERE i1.route_id IS NOT NULL


 LIMIT 1000









 DROP FUNCTION IF EXISTS isAsc;
 DELIMITER $$
 CREATE FUNCTION isAsc (section_part_id INT, route_id INT)
 RETURNS INT
 BEGIN

     RETURN (SELECT
             CASE
             WHEN (s2.id IS NULL OR s1.point1_id = s2.point1_id OR s1.point1_id = s2.point2_id)
             THEN 1
             ELSE -1
             END as is_asc

             FROM `bus-way`.section_part as sp
             JOIN `bus-way`.section as s1 ON s1.id = sp.section_id

             JOIN `bus-way`.route_section as rs1 ON rs1.route_id = route_id AND rs1.section_id = s1.id
             LEFT JOIN `bus-way`.route_section as rs2 ON rs2.route_id = route_id AND rs2.section_order = rs1.section_order - 1
             LEFT JOIN `bus-way`.section as s2 ON s2.id = rs2.section_id
             WHERE sp.id = section_part_id);

 END $$
 DELIMITER ;




 DROP PROCEDURE IF EXISTS statistic;
 DELIMITER $$
 CREATE PROCEDURE statistic (count INT, offset INT, modeId INT)
 BEGIN

    DECLARE done1 INT;

    DECLARE minIsAsc INT;
    DECLARE maxIsAsc INT;

    DECLARE minSectionOrder INT;
    DECLARE maxSectionOrder INT;
    DECLARE minSectionPartId INT;
    DECLARE maxSectionPartId INT;
    DECLARE timeToPass FLOAT;
    DECLARE routeId INT;
    DECLARE temp INT;
    DECLARE allCount INT;

    # To get all consecutive section parts in given route
    DECLARE curs1 CURSOR FOR  SELECT

                                     CASE
                                     WHEN (rs1.section_order < rs2.section_order)
                                     THEN i1.section_part_id
                                     ELSE i2.section_part_id
                                     END as fromSectionPart,

                                     CASE
                                     WHEN (rs1.section_order < rs2.section_order)
                                     THEN rs1.section_order
                                     ELSE rs2.section_order
                                     END as fromSectionOrder,

                                     CASE
                                     WHEN (rs1.section_order < rs2.section_order)
                                     THEN i2.section_part_id
                                     ELSE i1.section_part_id
                                     END as toSectionPart,

                                     CASE
                                     WHEN (rs1.section_order < rs2.section_order)
                                     THEN rs2.section_order
                                     ELSE rs1.section_order
                                     END as toSectionOrder,

                                     isAsc(CASE
                                           WHEN (rs1.section_order < rs2.section_order)
                                           THEN i1.section_part_id
                                           ELSE i2.section_part_id
                                           END,
                                           i1.route_id) as minIsAsc,
                                     isAsc(CASE
                                           WHEN (rs1.section_order < rs2.section_order)
                                           THEN i2.section_part_id
                                           ELSE i1.section_part_id
                                           END,
                                           i1.route_id) as maxIsAsc,


                                    (i2.timestamp - i1.timestamp) as timeToPass, i1.route_id

                             FROM bus_nodejs.gps_info as i1

                             JOIN bus_nodejs.gps_info as i2
                             ON  i1.imei = i2.imei
                             AND i2.timestamp > i1.timestamp
                             AND i1.route_id = i2.route_id
                             AND NOT EXISTS (SELECT *
                                             FROM bus_nodejs.gps_info as i3
                                             WHERE i1.imei = i3.imei
                                             AND i1.route_id = i3.route_id
                                             AND i3.timestamp > i1.timestamp
                                             AND i3.timestamp < i2.timestamp)


                             JOIN `bus-way`.section_part as sp1 ON sp1.id = i1.section_part_id
                             JOIN `bus-way`.route_section as rs1 ON rs1.section_id = sp1.section_id AND rs1.route_id = i1.route_id

                             JOIN `bus-way`.section_part as sp2 ON sp2.id = i2.section_part_id
                             JOIN `bus-way`.route_section as rs2 ON rs2.section_id = sp2.section_id AND rs2.route_id = i1.route_id


                             JOIN `bus-way`.statistic_mode as sm ON sm.id = modeId
                             JOIN `bus-way`.hour_type as ht ON ht.id = sm.hour_type_id
                             JOIN `bus-way`.hour_interval as hi ON hi.hour_type_id = ht.id

                             WHERE i1.route_id IS NOT NULL
                             AND ((sm.week_day_from <= sm.week_day_to AND sm.week_day_from <= DAYOFWEEK(i1.timestamp) AND sm.week_day_to >= DAYOFWEEK(i1.timestamp))
                                 OR (sm.week_day_from > sm.week_day_to AND (sm.week_day_from <= DAYOFWEEK(i1.timestamp) OR sm.week_day_to >= DAYOFWEEK(i1.timestamp))))
                             AND   ((sm.month_from <= sm.month_to AND sm.month_from <= MONTH(i1.timestamp) AND sm.month_to >= MONTH(i1.timestamp))
                                 OR (sm.month_from > sm.month_to AND (sm.month_from <= MONTH(i1.timestamp) OR sm.month_to >= MONTH(i1.timestamp))))
                             AND   ((hi.time_from <= hi.time_to AND hi.time_from <= TIME(i1.timestamp) AND hi.time_to >= TIME(i1.timestamp))
                                 OR (hi.time_from > hi.time_to AND (hi.time_from <= TIME(i1.timestamp) OR hi.time_to >= TIME(i1.timestamp))))

                             LIMIT offset, count;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done1 = 1;

    DROP TEMPORARY TABLE IF EXISTS tblResults;
    CREATE TEMPORARY TABLE IF NOT EXISTS tblResults  (
        intermediate_section_part_id INT,
        interval_to_pass FLOAT
    );

    OPEN curs1;
    SET done1 = 0;
    REPEAT

        FETCH curs1 INTO minSectionPartId, minSectionOrder, maxSectionPartId, maxSectionOrder, minIsAsc, maxIsAsc, timeToPass, routeId;

        # To get all count of section parts between given section parts in the given route
        SET allCount  = (SELECT COUNT(sp.id)
                         FROM `bus-way`.section_part as sp
                         JOIN `bus-way`.section as s ON s.id = sp.section_id
                         JOIN `bus-way`.route_section as rs ON rs.section_id = s.id

                         WHERE ((rs.section_order > minSectionOrder AND rs.section_order < maxSectionOrder)
                         OR (rs.section_order = minSectionOrder AND minSectionOrder != maxSectionOrder
                             AND minSectionPartId * minIsAsc <= sp.id * minIsAsc)

                         OR (rs.section_order = maxSectionOrder AND minSectionOrder != maxSectionOrder
                             AND maxSectionPartId * maxIsAsc >= sp.id * maxIsAsc)

                         OR (rs.section_order = maxSectionOrder AND minSectionOrder = maxSectionOrder
                             AND maxSectionPartId * maxIsAsc >= sp.id * maxIsAsc
                             AND minSectionPartId * minIsAsc <= sp.id * minIsAsc))

                         AND rs.route_id = routeId);

        # To get section parts and pass time of that between given section parts in the given route
        INSERT tblResults (intermediate_section_part_id, interval_to_pass)
                             SELECT sp.id, (timeToPass / allCount)
                             FROM `bus-way`.section_part as sp
                             JOIN `bus-way`.section as s ON s.id = sp.section_id
                             JOIN `bus-way`.route_section as rs ON rs.section_id = s.id

                             WHERE ((rs.section_order > minSectionOrder AND rs.section_order < maxSectionOrder)
                             OR (rs.section_order = minSectionOrder AND minSectionOrder != maxSectionOrder
                                 AND minSectionPartId * minIsAsc <= sp.id * minIsAsc)

                             OR (rs.section_order = maxSectionOrder AND minSectionOrder != maxSectionOrder
                                 AND maxSectionPartId * maxIsAsc >= sp.id * maxIsAsc)

                             OR (rs.section_order = maxSectionOrder AND minSectionOrder = maxSectionOrder
                                 AND maxSectionPartId * maxIsAsc >= sp.id * maxIsAsc
                                 AND minSectionPartId * minIsAsc <= sp.id * minIsAsc))

                             AND rs.route_id = routeId;
    UNTIL done1 END REPEAT;
    CLOSE curs1;

    SELECT CURRENT_TIME() as time_to, intermediate_section_part_id, SUM(interval_to_pass) / COUNT(interval_to_pass) FROM tblResults GROUP BY intermediate_section_part_id;

 END; $$
 DELIMITER ;





************************************************************************************************************************





 SELECT sp.id, (pairs.timeToPass / 10)
 FROM `bus-way`.section_part as sp
 JOIN `bus-way`.section as s ON s.id = sp.section_id
 JOIN `bus-way`.route_section as rs ON rs.section_id = s.id


 JOIN (SELECT

       CASE
       WHEN (rs1.section_order < rs2.section_order)
       THEN i1.section_part_id
       ELSE i2.section_part_id
       END as fromSectionPart,

       CASE
       WHEN (rs1.section_order < rs2.section_order)
       THEN rs1.section_order
       ELSE rs2.section_order
       END as fromSectionOrder,

       CASE
       WHEN (rs1.section_order < rs2.section_order)
       THEN i2.section_part_id
       ELSE i1.section_part_id
       END as toSectionPart,

       CASE
       WHEN (rs1.section_order < rs2.section_order)
       THEN rs2.section_order
       ELSE rs1.section_order
       END as toSectionOrder,

       isAsc(CASE
       WHEN (rs1.section_order < rs2.section_order)
       THEN i1.section_part_id
       ELSE i2.section_part_id
       END,
       i1.route_id) as minIsAsc,

       isAsc(CASE
       WHEN (rs1.section_order < rs2.section_order)
       THEN i2.section_part_id
       ELSE i1.section_part_id
       END,
       i1.route_id) as maxIsAsc,


       (i2.timestamp - i1.timestamp) as timeToPass, i1.route_id as routeId

       FROM bus_nodejs.gps_info as i1


       JOIN bus_nodejs.gps_info as i2
       ON  i1.imei = i2.imei
       AND i2.timestamp > i1.timestamp
       AND i1.route_id = i2.route_id
       AND NOT EXISTS (SELECT *
       FROM bus_nodejs.gps_info as i3
       WHERE i1.imei = i3.imei
       AND i1.route_id = i3.route_id
       AND i3.timestamp > i1.timestamp
       AND i3.timestamp < i2.timestamp)

       JOIN `bus-way`.section_part as sp1 ON sp1.id = i1.section_part_id
       JOIN `bus-way`.route_section as rs1 ON rs1.section_id = sp1.section_id AND rs1.route_id = i1.route_id

       JOIN `bus-way`.section_part as sp2 ON sp2.id = i2.section_part_id
       JOIN `bus-way`.route_section as rs2 ON rs2.section_id = sp2.section_id AND rs2.route_id = i1.route_id


       JOIN `bus-way`.statistic_mode as sm ON sm.id = 1
       JOIN `bus-way`.hour_type as ht ON ht.id = sm.hour_type_id
       JOIN `bus-way`.hour_interval as hi ON hi.hour_type_id = ht.id

       WHERE i1.route_id IS NOT NULL
       AND ((sm.week_day_from <= sm.week_day_to AND sm.week_day_from <= DAYOFWEEK(i1.timestamp) AND sm.week_day_to >= DAYOFWEEK(i1.timestamp))
       OR (sm.week_day_from > sm.week_day_to AND (sm.week_day_from <= DAYOFWEEK(i1.timestamp) OR sm.week_day_to >= DAYOFWEEK(i1.timestamp))))
       AND   ((sm.month_from <= sm.month_to AND sm.month_from <= MONTH(i1.timestamp) AND sm.month_to >= MONTH(i1.timestamp))
       OR (sm.month_from > sm.month_to AND (sm.month_from <= MONTH(i1.timestamp) OR sm.month_to >= MONTH(i1.timestamp))))
       AND   ((hi.time_from <= hi.time_to AND hi.time_from <= TIME(i1.timestamp) AND hi.time_to >= TIME(i1.timestamp))
       OR (hi.time_from > hi.time_to AND (hi.time_from <= TIME(i1.timestamp) OR hi.time_to >= TIME(i1.timestamp))))

       LIMIT 0, 1000) as pairs ON TRUE


 WHERE ((rs.section_order > pairs.fromSectionOrder AND rs.section_order < pairs.toSectionOrder)
 OR (rs.section_order = pairs.fromSectionOrder AND pairs.fromSectionOrder != pairs.toSectionOrder
 AND CAST(pairs.fromSectionPart AS SIGNED) * pairs.minIsAsc <= sp.id * pairs.minIsAsc)

 OR (rs.section_order = pairs.toSectionOrder AND pairs.fromSectionOrder != pairs.toSectionOrder
 AND CAST(pairs.toSectionPart AS SIGNED) * pairs.maxIsAsc >= sp.id * pairs.maxIsAsc)

 OR (rs.section_order = pairs.toSectionOrder AND pairs.fromSectionOrder = pairs.toSectionOrder
 AND CAST(pairs.toSectionPart AS SIGNED) * pairs.maxIsAsc >= sp.id * pairs.maxIsAsc
 AND CAST(pairs.fromSectionPart AS SIGNED) * pairs.minIsAsc <= sp.id * pairs.minIsAsc))

 AND rs.route_id = pairs.routeId

 */
