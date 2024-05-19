/**
 * Created by hazarapet on 3/25/15.
 */
var ee  = require("events").EventEmitter;
var eventEmitter = new ee;

var nearestSectionPart = require('./nearestSectionPart').findNearestSectionPart;
var routeDeterminator = require('./routeDeterminator').determineRoute;
var gps     = require('../gps-controller');
var param   = require('../../config/parameters');


function start() {

    var dataListener = gps.start(param.gps_controller.port);

    //When get gps data start to process it
    dataListener.on('data', function (gpsData) {

        var busInfo = {gpsData: gpsData};

        //Determine which section part is nearest to the bus
        var sectionPart = null;
        try {
            sectionPart = nearestSectionPart({
                imei: gpsData.imei,
                latitude: gpsData.latitude / 10000000,
                longitude: gpsData.longitude / 10000000
            });

            busInfo.sectionPart = sectionPart;
        }
        catch (e) {
            console.error(e.message);
        }


        if (sectionPart) {

            gpsData.section_part_id = sectionPart.id;

            //Try to determine in which route is bus
            try {
                gpsData.route_id = routeDeterminator(gpsData.imei, sectionPart.section.id);
                busInfo.routeId = gpsData.route_id;
            }
            catch (e) {
                console.error(e.message);
            }


            gpsData.save().then(function () {
                //console.log("success saving!!!!! via sequelize");
            });

        }
        else {
            console.log("Off Line");
        }

        eventEmitter.emit('data', busInfo);
    });

    return eventEmitter;
}

module.exports.start = start;