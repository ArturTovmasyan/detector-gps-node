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

 SELECT i1.section_part_id as fromSectionPart, i2.section_part_id as toSectionPart,
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

 JOIN   (CALL statistic (i1.section_part_id, i2.section_part_id, i1.route_id)) as sectionParts ON TRUE

 LIMIT 30






 SELECT sp.id
 FROM `bus-way`.section_part as sp
 JOIN `bus-way`.section as s ON s.id = sp.section_id
 JOIN `bus-way`.route_section as rs
 ON rs.section_id = s.id

 JOIN (SELECT MIN(rs1.section_order) as minOrder, MAX(rs1.section_order) as maxOrder
 FROM `bus-way`.section_part as sp1
 JOIN `bus-way`.route_section as rs1 ON rs1.section_id = sp1.section_id AND rs1.route_id = 1
 WHERE sp1.id = 26215 or sp1.id = 26216) as sectionOrders ON TRUE

 WHERE rs.section_order >= sectionOrders.minOrder AND rs.section_order <= sectionOrders.maxOrder AND rs.route_id = 1








 DROP PROCEDURE IF EXISTS statistic;
 DELIMITER $$
 CREATE PROCEDURE statistic ()
 BEGIN

    DECLARE done1 INT;

    DECLARE sectionPartId1 INT;
    DECLARE sectionPartId2 INT;
    DECLARE timeToPass FLOAT;
    DECLARE routeId INT;


    DECLARE curs1 CURSOR FOR  SELECT i1.section_part_id as fromSectionPart, i2.section_part_id as toSectionPart,
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
                             LIMIT 30;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done1 = 1;

    DROP TEMPORARY TABLE IF EXISTS tblResults;
    CREATE TEMPORARY TABLE IF NOT EXISTS tblResults  (
        section_part_id1 INT,
        section_part_id2 INT,
        time_to_pass FLOAT,
        route_id INT,
        intermediate_section_part_id INT,
        interval_to_pass FLOAT
    );

    OPEN curs1;
    SET done1 = 0;
    REPEAT

        FETCH curs1 INTO sectionPartId1, sectionPartId2, timeToPass, routeId;

        INSERT tblResults (section_part_id1, section_part_id2, time_to_pass, route_id, intermediate_section_part_id, interval_to_pass)
                             SELECT sectionPartId1, sectionPartId2, timeToPass, routeId, sp.id, (timeToPass / allCount.cnt)
                             FROM `bus-way`.section_part as sp
                             JOIN `bus-way`.section as s ON s.id = sp.section_id
                             JOIN `bus-way`.route_section as rs
                             ON rs.section_id = s.id

                             JOIN (SELECT MIN(rs1.section_order) as minOrder, MAX(rs1.section_order) as maxOrder
                             FROM `bus-way`.section_part as sp1
                             JOIN `bus-way`.route_section as rs1 ON rs1.section_id = sp1.section_id AND rs1.route_id = routeId
                             WHERE sp1.id = sectionPartId1 or sp1.id = sectionPartId2) as sectionOrders ON TRUE

                             JOIN (SELECT COUNT(sp.id) as cnt
                             FROM `bus-way`.section_part as sp
                             JOIN `bus-way`.section as s ON s.id = sp.section_id
                             JOIN `bus-way`.route_section as rs
                             ON rs.section_id = s.id

                             JOIN (SELECT MIN(rs1.section_order) as minOrder, MAX(rs1.section_order) as maxOrder
                             FROM `bus-way`.section_part as sp1
                             JOIN `bus-way`.route_section as rs1 ON rs1.section_id = sp1.section_id AND rs1.route_id = routeId
                             WHERE sp1.id = sectionPartId1 or sp1.id = sectionPartId2) as sectionOrders ON TRUE
                             WHERE rs.section_order >= sectionOrders.minOrder AND rs.section_order <= sectionOrders.maxOrder AND rs.route_id = routeId)
                             as allCount ON TRUE


                             WHERE rs.section_order >= sectionOrders.minOrder AND rs.section_order <= sectionOrders.maxOrder AND rs.route_id = routeId;

    UNTIL done1 END REPEAT;
    CLOSE curs1;

    SELECT * FROM tblResults;

 END; $$
 DELIMITER ;




 */
