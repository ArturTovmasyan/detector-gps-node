/**
 * Created by hazarapet on 3/25/15.
 */
var ee  = require("events").EventEmitter;
var eventEmitter = new ee;

var nearestSectionPart = require('./nearestSectionPart').findNearestSectionPart;
var routeDeterminator  = require('./routeDeterminator').determineRoute;
var determineSecOrder  = require('./determineSectionOrder').determineSectionOrder;

var gps                = require('../gps-controller');
var param              = require('../../config/parameters');
var loader             = require("../data-loader");

var sequelize          = require('../models/Sequelize');
var GpsData            = require('../models').GpsData;



/*********************************************************************************************
 busInfo: structure

 {
     gpsData: { id: 15,
                timestamp: '2015-06-16 15:00:00',
                priority: 0,
                longitude: 40.112365541,
                latitude: 44.11225412,
                altitude: 2,
                angle: 254,
                satellites: 9,
                speed: 40,
                statistic_mode_code: 'Sum_pic',
                section_part_id: 36584,
                route_id: 9 },
     lineNumber: 47,
     plateNumber: 4587,
     busStatus: 'on_line',
     section_order: 168,

     # Only for testing #
     sectionPart: { id: 18,
                    latitude: 40.88556612,
                    longitude: 44.55211552, .... },
     routes: [{...}, {...}]
 }

 ***********************************************************************************************/


function start() {

    var dataListener = gps.start(param.gps_controller.port);
    var gpsDatas     = [];

    //When get gps data start to process it
    dataListener.on('data', function (gpsData) {

        //To collect all necessary data here
        var busInfo = {gpsData: gpsData};


        //************************************* Determine section part *************************************************

        var sectionPart = null;
        var sectionId   = null;
        try {
            sectionPart = nearestSectionPart({
                imei: gpsData.imei,
                latitude: gpsData.latitude / 10000000,
                longitude: gpsData.longitude / 10000000
            });

            sectionId               = sectionPart ? sectionPart.section.id : sectionId;
            gpsData.section_part_id = sectionPart ? sectionPart.id         : null;


            busInfo.lineNumber  = loader.findBusByImei(gpsData.imei).line_number;
            busInfo.plateNumber = loader.findBusByImei(gpsData.imei).plate_number;

            //TODO: only for testing
            busInfo.sectionPart = sectionPart;
            busInfo.routes      = loader.findLineRoutes(busInfo.lineNumber);
        }
        catch (e) {
            //console.error(e.message);
        }
        //**************************************************************************************************************


        //***************************************** Determine route ****************************************************

        try {
            gpsData.route_id = routeDeterminator(gpsData.imei, sectionId);

            busInfo.busStatus  = gpsData.route_id ? 'on_line' : 'off_line';
        }
        catch (e) {
            //console.error(e.message);
        }
        //**************************************************************************************************************


        //***************************************** Determine Section order ****************************************************
        try {
            busInfo.section_order = determineSecOrder(gpsData.imei, gpsData.route_id, sectionId);
        }
        catch (e) {
            //console.error(e.message);
        }
        //**************************************************************************************************************


        //***************************************** Statistic mode ****************************************************
        try {
            gpsData.statistic_mode_code = loader.getStatisticMode();
        }
        catch (e) {
            //console.error(e.message);
        }
        //**************************************************************************************************************


        if (gpsData.route_id && gpsData.section_part_id && gpsData.statistic_mode_code && loader.mySqlQueries == 0) {
            //Insert gpsData to the database
            gpsDatas.push({'imei': gpsData.imei,
                            'timestamp': gpsData.timestamp,
                            'priority': gpsData.priority,
                            'longitude': gpsData.longitude,
                            'latitude': gpsData.latitude,
                            'altitude': gpsData.altitude,
                            'angle': gpsData.angle,
                            'satellites': gpsData.satellites,
                            'speed': gpsData.speed,
                            'statistic_mode_code': gpsData.statistic_mode_code,
                            'section_part_id': gpsData.section_part_id,
                            'route_id': gpsData.route_id});

            console.log(gpsDatas.length, param.sequelize.bulkSaveCount);
            if (gpsDatas.length >= param.sequelize.bulkSaveCount) {
                GpsData.bulkCreate(gpsDatas).then(function () {
                    console.log("success saving!!!!! via sequelize");
                });

                gpsDatas = [];
            }
        }

        eventEmitter.emit('data', busInfo);
    });

    return eventEmitter;
}

module.exports.start = start;

//
//var gpst1 = GpsData.build();
//
//gpst1.imei  = 5555;
//gpst1.timestamp = new Date();
//gpst1.priority= 1;
//gpst1.longitude= 40.5555;
//gpst1.latitude= 44.222252;
//gpst1.altitude= 5;
//gpst1.angle= 256;
//gpst1.satellites= 9;
//gpst1.speed= 46;
//gpst1.statistic_mode_code= 'ss';
//gpst1.section_part_id= 11225;
//gpst1.route_id= 8;
//
//var gpst2 = GpsData.build();
//
//gpst2.imei  = 5555;
//gpst2.timestamp = new Date();
//gpst2.priority= 1;
//gpst2.longitude= 40.5555;
//gpst2.latitude= 44.222252;
//gpst2.altitude= 5;
//gpst2.angle= 256;
//gpst2.satellites= 9;
//gpst2.speed= 46;
//gpst2.statistic_mode_code= 'ss';
//gpst2.section_part_id= 11225;
//gpst2.route_id= 8;
//
//gpsDatas = [];
//
//gpsDatas.push({'imei': gpst1.imei, 'timestamp': gpst1.timestamp, 'priority': gpst1.priority, 'longitude': gpst1.longitude, 'latitude': gpst1.latitude,
//    'altitude': gpst1.altitude, 'angle': gpst1.angle, 'satellites': gpst1.satellites, 'speed': gpst1.speed, 'statistic_mode_code': gpst1.statistic_mode_code,
//    'section_part_id': gpst1.section_part_id, 'route_id': gpst1.route_id});
//
//gpsDatas.push({'imei': gpst2.imei, 'timestamp': gpst2.timestamp, 'priority': gpst2.priority, 'longitude': gpst2.longitude, 'latitude': gpst2.latitude,
//    'altitude': gpst2.altitude, 'angle': gpst2.angle, 'satellites': gpst2.satellites, 'speed': gpst2.speed, 'statistic_mode_code': gpst2.statistic_mode_code,
//    'section_part_id': gpst2.section_part_id, 'route_id': gpst2.route_id});
//
//
////gpsDatas = [
////    {'imei': gpst1.imei, 'timestamp': gpst1.timestamp, 'priority': gpst1.priority, 'longitude': gpst1.longitude, 'latitude': gpst1.latitude,
////        'altitude': gpst1.altitude, 'angle': gpst1.angle, 'satellites': gpst1.satellites, 'speed': gpst1.speed, 'statistic_mode_code': gpst1.statistic_mode_code,
////        'section_part_id': gpst1.section_part_id, 'route_id': gpst1.route_id},
////    {'imei': gpst2.imei, 'timestamp': gpst2.timestamp, 'priority': gpst2.priority, 'longitude': gpst2.longitude, 'latitude': gpst2.latitude,
////        'altitude': gpst2.altitude, 'angle': gpst2.angle, 'satellites': gpst2.satellites, 'speed': gpst2.speed, 'statistic_mode_code': gpst2.statistic_mode_code,
////        'section_part_id': gpst2.section_part_id, 'route_id': gpst2.route_id}
////];
//
//GpsData.bulkCreate(gpsDatas).then(function () {
//    console.log("success saving!!!!! via sequelize");
//});