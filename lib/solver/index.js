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
var statistic          = require('../statistic');




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
    var isReadyToSave = true;
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

            try {
                statistic.saveStatistic(gpsData);
            }
            catch(e){
                console.log(e.message);
            }
            //Insert gpsData to the database
            //gpsDatas.push({'imei': gpsData.imei,
            //                'timestamp': gpsData.timestamp,
            //                'priority': gpsData.priority,
            //                'longitude': gpsData.longitude,
            //                'latitude': gpsData.latitude,
            //                'altitude': gpsData.altitude,
            //                'angle': gpsData.angle,
            //                'satellites': gpsData.satellites,
            //                'speed': gpsData.speed,
            //                'statistic_mode_code': gpsData.statistic_mode_code,
            //                'section_part_id': gpsData.section_part_id,
            //                'route_id': gpsData.route_id});
            //
            //console.log(gpsDatas.length, param.sequelize.bulkSaveCount);
            //if (gpsDatas.length >= param.sequelize.bulkSaveCount && isReadyToSave) {
            //    isReadyToSave = false;
            //    GpsData.bulkCreate(gpsDatas).then(function () {
            //        console.log("success saving!!!!! via sequelize");
            //        isReadyToSave = true;
            //    });
            //
            //    gpsDatas = [];
            //}
        }

        eventEmitter.emit('data', busInfo);
    });

    return eventEmitter;
}

module.exports.start = start;