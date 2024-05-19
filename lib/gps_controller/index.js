/**
 * Created by andranik on 3/11/15.
 */

var net = require('net');
var log = require('../logger');

exports.start = function(port)
{
    var netServer = net.createServer(function (c) {

        c.on('data', function (data) {

            //If it is first connection then if becoma with 0x000f it is 15
            if (data.readInt16BE(0) === 15) {
                var buf = Buffer(1);
                buf.writeUInt8(0x01, 0);
                c.write(buf);

                log.info('incoming ... ' + data);
                console.log('incoming .. ' + data);
            }
            else if (data.readInt32BE(0) === 0) {


                var dataLength = data.readInt32BE(4);
                var CodecId = data.readInt8(8);
                var NumberOfData = data.readInt8(9);


                console.log('dataLength: ' + dataLength);
                log.info('dataLength: ' + dataLength);
                console.log('CodecId: ' + CodecId);
                log.info('CodecId: ' + CodecId);
                console.log('NumberOfData: ' + NumberOfData);
                log.info('NumberOfData: ' + NumberOfData);

                var curIndex = 10;
                var timestamp = [];
                var priority = [];
                var longitude = [];
                var latitude = [];
                var altitude = [];
                var angle = [];
                var satellites = [];
                var speed = [];


                for (var i = 0; i < data.length; i++) {
                    console.log(data[i].toString(16));
                }
                console.log('cycle end');


                for (i = 0; i < NumberOfData; i++) {
                    timestamp[i] = data.readUInt32BE(curIndex) * 0x100000000 + data.readUInt32BE(curIndex + 4);
                    priority[i] = data.readUInt8(curIndex + 8);
                    longitude[i] = data.readInt32BE(curIndex + 9);
                    latitude[i] = data.readInt32BE(curIndex + 13);
                    altitude[i] = data.readUInt16BE(curIndex + 17);
                    angle[i] = data.readUInt16BE(curIndex + 19);
                    satellites[i] = data.readUInt8(curIndex + 21);
                    speed[i] = data.readUInt16BE(curIndex + 22)

                    curIndex += 24 + 2;
                    curIndex += data.readUInt8(curIndex) + 1;
                    curIndex += data.readUInt8(curIndex) + 1;
                    curIndex += data.readUInt8(curIndex) + 1;
                    curIndex += data.readUInt8(curIndex) + 1;

                    //console.log(data.readUInt32BE(curIndex)*0x100000000 + data.readUInt32BE(curIndex + 4));


                    console.log(i + ' timestamp: ' + timestamp[i]);
                    console.log(i + ' priority ' + priority[i]);
                    console.log(i + ' longitude ' + longitude[i]);
                    console.log(i + ' latitude ' + latitude[i]);
                    console.log(i + ' altitude ' + altitude[i]);
                    console.log(i + ' angle ' + angle[i]);
                    console.log(i + ' satellites ' + satellites[i]);
                    console.log(i + ' speed ' + speed[i]);

                    console.log(i + 'th data end');
                }

                console.log('====================================== Data end ========================================');


                //answer to gps the number of received data
                var numberOfDataBuf = new Buffer([0, 0, 0, 0]);
                numberOfDataBuf.writeUInt8(NumberOfData, 3);
                c.write(numberOfDataBuf);
            }


        });
    }).listen(port, function() {
        console.log(process.pid + ' bound')
    });
};
