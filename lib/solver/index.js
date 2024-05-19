/**
 * Created by hazarapet on 3/25/15.
 */
var ee  = require("events").EventEmitter;
var eventEmitter = new ee;

var nearestSectionPart = require('./nearestSectionPart').findNearestSectionPart;
var routeDeterminator  = require('./routeDeterminator').determineRoute;
var gps                = require('../gps-controller');
var param              = require('../../config/parameters');
var loader             = require("../data-loader");

function start() {

    var dataListener = gps.start(param.gps_controller.port);

    //When get gps data start to process it
    dataListener.on('data', function (gpsData) {

        //TODO: bus info collect data only for testing, after we will send only gpsData which collect all necessary data
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

            //TODO: only for testing
            busInfo.sectionPart = sectionPart;
        }
        catch (e) {
            console.error(e.message);
        }
        //**************************************************************************************************************



        //***************************************** Determine route ****************************************************

        try {
            gpsData.route_id = routeDeterminator(gpsData.imei, sectionId);

            //TODO: only for testing
            busInfo.routeId = gpsData.route_id;
            busInfo.busStatus  = gpsData.route_id ? 'on_line' : 'off_line';
        }
        catch (e) {
            console.error(e.message);
        }
        //**************************************************************************************************************


        //***************************************** Statistic mode ****************************************************
        try {
            gpsData.statistic_mode_code = loader.getStatisticMode();
        }
        catch (e) {
            console.error(e.message);
        }
        //**************************************************************************************************************


        if (gpsData.route_id) {
            //Insert gpsData to the database
            gpsData.save().then(function () {
                //console.log("success saving!!!!! via sequelize");
            });
        }

        eventEmitter.emit('data', busInfo);
    });

    return eventEmitter;
}

module.exports.start = start;