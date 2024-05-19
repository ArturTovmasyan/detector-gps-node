/**
 * Created by andranik on 3/11/15.
 */

var param   = require("../../config/parameters");
var net     = require('net');
var log     = require('../logger');
var GpsData = require('../models').GpsData;
var ee      = require("events").EventEmitter;
var eventEmitter = new ee;

//Array to save ip:port corresponding it's IMEI
var ipIMEI = [];

exports.start = function(port)
{
    var netServer = net.createServer(function (socket) {

        var sockets = {};
        socket.on('data', function (data) {

            for(var k in param.data_resend_info) {

                if (!sockets[k]) {
                    sockets[k] = new net.Socket();
                    sockets[k].connect(param.data_resend_info[k].port, param.data_resend_info[k].host, function () {
                        console.log("Connected to: ", param.data_resend_info[k].port, param.data_resend_info[k].host, k);
                    });

                    sockets[k].on('error', function () {
                        sockets[k] = null;
                        console.log("Error during connection to: ", param.data_resend_info[k].port, param.data_resend_info[k].host, k);
                    });
                }

                if (sockets[k]){
                    if (ipIMEI[socket.key]){
                        sockets[k].write('#' + ipIMEI[socket.key] + '#' + data);
                    }
                    else {
                        sockets[k].write(data);
                    }
                }
            }

            if (!ipIMEI[socket.key]){
                var str = data.toString();
                if (str[0] == '#'){
                    ipIMEI[socket.key] = str.split('#')[1];
                }
            }

            //If it is first connection then if become with 0x000f it is 15
            if (data.readInt16BE(0) === 15) {

                var check = checkIMEI(data);
                if (check.IMEI) {
                    //If IMEI is recognized aprove an request
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
                    eventEmitter.emit('data', parsedData.lastInfo);
                }
            }
        });


        //Listen on the close event to delete an Ip:port-IMEI pair
        socket.on('close', function(had_error) {
            log.info('connection closed ip:' + socket.key + ' IMEI:' + ipIMEI[socket.key]);
            //When connection closed delete an Ip:port-IMEI pair
            delete ipIMEI[socket.key];
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

    //Variable to collect all data here
    var gpsDatas = {};
    var curIndex = 10;
    var maxTimestamp = 0;
    for (var i = 0; i < NumberOfData; i++) {

        try {
            var temp = AVLDataParse(IMEI, data, curIndex);
            curIndex += temp.length;
            gpsDatas[temp.data.timestamp] = temp.data;

            if (maxTimestamp < temp.data.timestamp || maxTimestamp === 0) {
                maxTimestamp = temp.data.timestamp;
            }
        }
        catch(err) {
            return {retData: numberOfDataBuf};
        }
    }

    return {retData: numberOfDataBuf, lastInfo: gpsDatas[maxTimestamp]};
}

/**
 *
 * @param IMEI
 * @param data
 * @param offset
 * @returns {{length: number, data: {}}}
 * @constructor
 */
function AVLDataParse(IMEI, data, offset) {

    var gpsData = GpsData.build();
    gpsData.imei = IMEI;
    var timestamp = new Date(data.readUInt32BE(offset) * 0x100000000 + data.readUInt32BE(offset + 4));
    gpsData.timestamp   = timestamp.toISOString();
    gpsData.priority    = data.readUInt8(offset + 8);
    gpsData.longitude   = data.readInt32BE(offset + 9);
    gpsData.latitude    = data.readInt32BE(offset + 13);
    gpsData.altitude    = data.readUInt16BE(offset + 17);
    gpsData.angle       = data.readUInt16BE(offset + 19);
    gpsData.satellites  = data.readUInt8(offset + 21);
    gpsData.speed       = data.readUInt16BE(offset + 22);


    //Go throw IO Elements
    var length = 24 + 2;
    length += data.readUInt8(offset + length) + 1;
    length += data.readUInt8(offset + length) + 1;
    length += data.readUInt8(offset + length) + 1;
    length += data.readUInt8(offset + length) + 1;

    return {length: length, data: gpsData};
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
