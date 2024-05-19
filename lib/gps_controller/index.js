/**
 * Created by andranik on 3/11/15.
 */

var net = require('net');
var log = require('../logger');
var db  = require('./db');
var ee  = require("events").EventEmitter;
var eventEmitter = new ee;

//Array to save ip:port corresponding it's IMEI
var ipIMEI = [];

exports.start = function(port)
{
    var netServer = net.createServer(function (socket) {

        socket.on('data', function (data) {

            //If it is first connection then if becoma with 0x000f it is 15
            if (data.readInt16BE(0) === 15) {
                var buf = new Buffer(1);
                buf.writeUInt8(0x01, 0);
                socket.write(buf);

                socket.key = socket.remoteAddress + ":" + socket.remotePort;
                ipIMEI[socket.key] = data.slice(2, data.readUInt16BE(0) + 2).toString();

                log.info('Incoming request from: ' + ipIMEI[socket.key]);
            }
            else if (data.readInt32BE(0) === 0) {

                var dataLength   = data.readInt32BE(4);
                var CodecId      = data.readInt8(8);
                var NumberOfData = data.readInt8(9);

                log.info('=== DATA FROM ' + ipIMEI[socket.key] + ' PROCESS ID ' + process.pid + '===');
                log.info('dataLength: ' + dataLength);
                log.info('CodecId: ' + CodecId);
                log.info('NumberOfData: ' + NumberOfData);
                log.debug(data.toString('hex'));

                //Variable to collect all data here
                var busInfo = {IMEI: ipIMEI[socket.key], data: {}};
                var curIndex = 10;
                var maxTimestamp = 0;

                db.beginTransaction(function(err) {
                    if (err) {
                        console.log('error in transaction' + err);

                    }
                });

                for (var i = 0; i < NumberOfData; i++) {

                    var temp = AVLDataParse(data, curIndex);
                    curIndex += temp.length;

                    busInfo.data[temp.data.timestamp] = temp.data;

                    if (maxTimestamp < temp.data.timestamp) {
                        maxTimestamp = temp.data.timestamp;
                    }

                    //Save data to database
                    db.flush(busInfo.IMEI, busInfo.data[temp.data.timestamp], function(err) {
                        log.error('Error during flushing gps data' + err);
                    });
                }


                db.commit(function(err) {
                    if (err) {
                        console.log('error in commit' + err);
                    }
                });

                //TODO: ============================================
                //TODO: === Need to save busInfo in the database ===
                //TODO: ============================================

                //answer to gps the number of received data
                var numberOfDataBuf = new Buffer([0, 0, 0, 0]);
                numberOfDataBuf.writeUInt8(NumberOfData, 3);
                socket.write(numberOfDataBuf);

                //Send received data through event to collect it
                eventEmitter.emit('data', {IMEI: busInfo.IMEI, data: busInfo.data[maxTimestamp]});
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

    var parsedData = {};
    parsedData.timestamp   = data.readUInt32BE(offset) * 0x100000000 + data.readUInt32BE(offset + 4);
    parsedData.priority    = data.readUInt8(offset + 8);
    parsedData.longitude   = data.readInt32BE(offset + 9);
    parsedData.latitude    = data.readInt32BE(offset + 13);
    parsedData.altitude    = data.readUInt16BE(offset + 17);
    parsedData.angle       = data.readUInt16BE(offset + 19);
    parsedData.satellites  = data.readUInt8(offset + 21);
    parsedData.speed       = data.readUInt16BE(offset + 22);

    log.debug('timestamp: '  + parsedData.timestamp);
    log.debug('priority: '   + parsedData.priority);
    log.debug('longitude: '  + parsedData.longitude);
    log.debug('latitude: '   + parsedData.latitude);
    log.debug('altitude: '   + parsedData.altitude);
    log.debug('angle: '      + parsedData.angle);
    log.debug('satellites: ' + parsedData.satellitess);
    log.debug('speed: '      + parsedData.speed);


    //Go throw IO Elements
    var length = 24 + 2;
    length += data.readUInt8(offset + length) + 1;
    log.debug('first end: ' + (offset + length));

    length += data.readUInt8(offset + length) + 1;
    log.debug('second end: ' + (offset + length));

    length += data.readUInt8(offset + length) + 1;
    log.debug('third end: ' + (offset + length));

    length += data.readUInt8(offset + length) + 1;
    log.debug('fourth end: ' + (offset + length));

    return {length: length, data: parsedData};
}
