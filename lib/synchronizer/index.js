/**
 * Created by andranik on 6/4/15.
 */

var loader_conf       = require('../../config/parameters').loader;
var Client            = require('node-rest-client').Client;
var client            = new Client();
var ee                = require("events").EventEmitter;
var changesEvent      = new ee;

var LastSyncTimestamp = require('../models')['GeoModels/LastSyncTimestamp'];
var Line              = require('../models')['GeoModels/Line'];
var Route             = require('../models')['GeoModels/Route'];
var Section           = require('../models')['GeoModels/Section'];
var Stop              = require('../models')['GeoModels/Stop'];
var SectionPart       = require('../models')['GeoModels/SectionPart'];
var Point             = require('../models')['GeoModels/Point'];
var RouteSection      = require('../models')['GeoModels/RouteSection'];
var RouteStop         = require('../models')['GeoModels/RouteStop'];
var StopSectionPart   = require('../models')['GeoModels/StopSectionPart'];

var ACTION_INSERT  = 0;
var ACTION_REMOVE  = 1;
var ACTION_UPDATE  = 2;

var tableModel = {
    line:               Line,
    route:              Route,
    section:            Section,
    stop:               Stop,
    section_part:       SectionPart,
    point:              Point,
    route_section:      RouteSection,
    route_stop:         RouteStop,
    stop_section_part:  StopSectionPart
};

function syncronize() {
    LastSyncTimestamp.find({where: {code: 'last_sync_timestamp'}}).then(
        function (lastSyncTimestamp) {

            //Create new instance if not exists
            if (!lastSyncTimestamp) {
                lastSyncTimestamp = LastSyncTimestamp.build({
                    code: 'last_sync_timestamp',
                    timestamp: new Date(0)
                });
            }

            var events = [];
            $timestamp = lastSyncTimestamp.timestamp.getTime() / 1000;
            client.get(loader_conf.host + "/api/audits/" + $timestamp, function (auditData) {

                if (auditData.length) {
                    changesEvent.emit('changes');
                }


                for (var i = 0; i < auditData.length; i++) {
                    events[i] = new ee();

                    events[i].on('turn', function(i) {

                        var audit = auditData[i];

                        if (tableModel[audit.table_name]) {

                            if (audit.action == ACTION_INSERT || audit.action == ACTION_UPDATE) {
                                tableModel[audit.table_name].findById(audit.object.id).then(function (object) {

                                    if (!object) {
                                        object = tableModel[audit.table_name].build()
                                    }

                                    for (var key in audit.object) {
                                        object[key] = audit.object[key];
                                    }

                                    object.save().then(function (obj) {
                                        console.log(audit.action, audit.table_name, obj.id);

                                        if (events[i + 1]) {
                                            events[i + 1].emit('turn', i + 1);
                                        }
                                    });
                                });
                            }
                            else if (audit.action == ACTION_REMOVE) {
                                tableModel[audit.table_name].destroy({where: {id: audit.object.id}}).then(function () {
                                    console.log('remove', audit.table_name, audit.object.id);

                                    if (events[i + 1]) {
                                        events[i + 1].emit('turn', i + 1);
                                    }
                                });
                            }
                        }
                        else {
                            events[i + 1].emit('turn', i + 1);
                        }
                    });
                }


                if (auditData.length) {
                    events[0].emit('turn', 0);
                }

                //Set new Last sync time
                lastSyncTimestamp.timestamp = new Date();
                lastSyncTimestamp.save();
            });
        }
    );

    return changesEvent;
}


module.exports.syncronize = syncronize;

module.exports.commands = {
    'syncronize': {
        "run": syncronize,
        description: "This command is used to syncromize database with symfony admin"
    }
};

