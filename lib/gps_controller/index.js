/**
 * Created by andranik on 3/11/15.
 */

var net = require('net');
var log = require('../logger');
var ee = require("events").EventEmitter;

//Array to save ip:port corresponding it's IMEI
var ipIMEI = [];

exports.start = function(port)
{
    var netServer = net.createServer(function (socket) {

        socket.on('data', function (data) {

            //If it is first connection then if becoma with 0x000f it is 15
            if (data.readInt16BE(0) === 15) {
                var buf = Buffer(1);
                buf.writeUInt8(0x01, 0);
                socket.write(buf);

                log.info('incoming ... ' + data);
                console.log('incoming .. ' + data);

                socket.key = socket.remoteAddress + ":" + socket.remotePort;
                ipIMEI[socket.key] = data;
            }
            else if (data.readInt32BE(0) === 0) {

                var dataLength = data.readInt32BE(4);
                var CodecId = data.readInt8(8);
                var NumberOfData = data.readInt8(9);


                log.info('=============== FROM ' + ipIMEI[socket.key] + ' ===========');
                log.info('dataLength: ' + dataLength);
                log.info('CodecId: ' + CodecId);
                log.info('NumberOfData: ' + NumberOfData);

                //Variable to collect all data here
                var busInfo = {IMEI: ipIMEI[socket.key], data: []};

                //Variable to save current index
                var curIndex = 10;
                for (var i = 0; i < NumberOfData; i++) {

                    //Read data and collect it in the busInfo.data[timestamp]
                    var timestamp = data.readUInt32BE(curIndex) * 0x100000000 + data.readUInt32BE(curIndex + 4);
                    busInfo.data[timestamp] = {};
                    busInfo.data[timestamp].timestamp   = timestamp;
                    busInfo.data[timestamp].priority    = data.readUInt8(curIndex + 8);
                    busInfo.data[timestamp].longitude   = data.readInt32BE(curIndex + 9);
                    busInfo.data[timestamp].latitude    = data.readInt32BE(curIndex + 13);
                    busInfo.data[timestamp].altitude    = data.readUInt16BE(curIndex + 17);
                    busInfo.data[timestamp].angle       = data.readUInt16BE(curIndex + 19);
                    busInfo.data[timestamp].satellites  = data.readUInt8(curIndex + 21);
                    busInfo.data[timestamp].speed       = data.readUInt16BE(curIndex + 22)

                    //Go throw IO Elements
                    curIndex += 24 + 2;
                    curIndex += data.readUInt8(curIndex) + 1;
                    curIndex += data.readUInt8(curIndex) + 1;
                    curIndex += data.readUInt8(curIndex) + 1;
                    curIndex += data.readUInt8(curIndex) + 1;
                }

                //TODO: ============================================
                //TODO: === Need to save busInfo in the database ===
                //TODO: ============================================

                //answer to gps the number of received data
                var numberOfDataBuf = new Buffer([0, 0, 0, 0]);
                numberOfDataBuf.writeUInt8(NumberOfData, 3);
                socket.write(numberOfDataBuf);

                //Send received data through event to collect it
                ee.emit('data', {IMEI: busInfo.IMEI, data: busInfo.data[busInfo.data.length - 1]});
            }
        });

        socket.on('close', function(had_error) {

            delete ipIMEI[socket.key];
            log.error('closed____ ' + socket.key);
        });

    });

    netServer.listen(port, function() {
        console.log(process.pid + ' bound')
    });

    return ee;
};
