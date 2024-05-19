/**
 * Created by andranik on 3/11/15.
 */

var net = require('net');
var log = require('../logger');
var db  = require('./db');
var GpsInfo = require('../models').GpsInfo;
var ee  = require("events").EventEmitter;
var eventEmitter = new ee;

//Array to save ip:port corresponding it's IMEI
var ipIMEI = [];

exports.start = function(port)
{
    var netServer = net.createServer(function (socket) {

        socket.on('data', function (data) {

            //If it is first connection then if become with 0x000f it is 15
            if (data.readInt16BE(0) === 15) {

                var check = checkIMEI(data);
                if (check.IMEI) {
                    socket.write(check.retData);
                    socket.key = socket.remoteAddress + ":" + socket.remotePort;
                    ipIMEI[socket.key] = check.IMEI;

                    log.info('Incoming request from: ' + ipIMEI[socket.key]);
                }
                else {
                    socket.write(check.retData);
                }
            }
            else if (data.readInt32BE(0) === 0) {

                var parsedData = AVLDataArrayParse(ipIMEI[socket.key], data);
                socket.write(parsedData.retData);

                if (parsedData.lastInfo) {
                    //Send received data through event to collect it
                    eventEmitter.emit('data', {IMEI: ipIMEI[socket.key], data: parsedData.lastInfo});
                }
            }
        });

        //Listen on the close event to delete an Ip:port-IMEI pair
        socket.on('close', function(had_error) {
            //When connection closed delete an Ip:port-IMEI pair
            delete ipIMEI[socket.key];
            log.info('connection closed ip:' + socket.key + ' IMEI:' + ipIMEI[socket.key]);
        });

        socket.on('error', function() {
            log.error('connection closed by error');
        });
    });

    //Start listen on the given port
    netServer.listen(port, function() {
        console.log(process.pid + ' bound')
    });

    return eventEmitter;
};


/**
 *
 * @param data
 * @param offset
 * @returns {{}}
 * @constructor
 */
function AVLDataParse(data, offset) {

    var gpsInfo = GpsInfo.build();
    var timestamp = new Date(data.readUInt32BE(offset) * 0x100000000 + data.readUInt32BE(offset + 4));
    gpsInfo.timestamp   = timestamp.toISOString();
    gpsInfo.priority    = data.readUInt8(offset + 8);
    gpsInfo.longitude   = data.readInt32BE(offset + 9);
    gpsInfo.latitude    = data.readInt32BE(offset + 13);
    gpsInfo.altitude    = data.readUInt16BE(offset + 17);
    gpsInfo.angle       = data.readUInt16BE(offset + 19);
    gpsInfo.satellites  = data.readUInt8(offset + 21);
    gpsInfo.speed       = data.readUInt16BE(offset + 22);

    gpsInfo.save().then(function() {
        console.log("success saving!!!!! via sequelize");
    });


    var parsedData = {};
    parsedData.timestamp   = new Date(data.readUInt32BE(offset) * 0x100000000 + data.readUInt32BE(offset + 4));
    parsedData.timestamp   = parsedData.timestamp.toISOString();
    parsedData.priority    = data.readUInt8(offset + 8);
    parsedData.longitude   = data.readInt32BE(offset + 9);
    parsedData.latitude    = data.readInt32BE(offset + 13);
    parsedData.altitude    = data.readUInt16BE(offset + 17);
    parsedData.angle       = data.readUInt16BE(offset + 19);
    parsedData.satellites  = data.readUInt8(offset + 21);
    parsedData.speed       = data.readUInt16BE(offset + 22);

    //Go throw IO Elements
    var length = 24 + 2;
    length += data.readUInt8(offset + length) + 1;
    length += data.readUInt8(offset + length) + 1;
    length += data.readUInt8(offset + length) + 1;
    length += data.readUInt8(offset + length) + 1;

    return {length: length, data: parsedData};
}

/**
 *
 * @param IMEI
 * @param data
 * @returns {{retData: Buffer, lastInfo: *}}
 * @constructor
 */
function AVLDataArrayParse(IMEI, data)
{
    var dataLength   = data.readInt32BE(4);
    var CodecId      = data.readInt8(8);
    var NumberOfData = data.readInt8(9);

    //answer to gps the number of received data
    var numberOfDataBuf = new Buffer([0, 0, 0, 0]);
    numberOfDataBuf.writeUInt8(NumberOfData, 3);

    log.info('=== DATA FROM ' + IMEI + ' PROCESS ID ' + process.pid + '===');
    log.info('dataLength: ' + dataLength);
    log.info('CodecId: ' + CodecId);
    log.info('NumberOfData: ' + NumberOfData);
    log.debug(data.toString('hex'));

    //Variable to collect all data here
    var busInfo = {};
    var curIndex = 10;
    var maxTimestamp = 0;
    for (var i = 0; i < NumberOfData; i++) {

        try {
            var temp = AVLDataParse(data, curIndex);
            curIndex += temp.length;

            busInfo[temp.data.timestamp] = temp.data;

            if (maxTimestamp < temp.data.timestamp || maxTimestamp === 0) {
                maxTimestamp = temp.data.timestamp;
            }

            //Save data to database
            db.flush(IMEI, busInfo[temp.data.timestamp], function (err) {
                log.error('Error during flushing gps data' + err);
            });
        }
        catch(err) {
            return {retData: numberOfDataBuf};
        }
    }

    return {retData: numberOfDataBuf, lastInfo: busInfo[maxTimestamp]};
}

/**
 *
 * @param data
 * @returns {{retData: Buffer, IMEI: string}}
 */
function checkIMEI(data)
{
    var buf = new Buffer(1);
    buf.writeUInt8(0x01, 0);

    var IMEI = data.slice(2, data.readUInt16BE(0) + 2).toString();

    return {retData: buf, IMEI: IMEI}
}
