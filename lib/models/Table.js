/**
 * Created by andranik on 3/24/15.
 */

var models = require('./index');

var commands = {
    'table:create': {
        "run": tableCreate,
        "flags": {
            "-force": "To drop an existing tables and create new tables"
        },
        description: "This commands is used to create tables \n\tflags: -force To drop an existing tables and create new tables "
    },
    'statistic:trigger:create': {
        "run": statisticTrigger,
        description: "This command is used to create a gps statistic trigger"
    }
};


function statisticTrigger(flags, errorCallback)
{
    var sequelize = models.sequelize;
    var query = sequelize.query(
        "CREATE TRIGGER AFTER_gps_info_test_INSERT AFTER INSERT " +
        "ON gps_info_test FOR EACH ROW " +
        "BEGIN " +
        "DECLARE valid INT DEFAULT 0; " +
        "DECLARE invalid INT  DEFAULT 0; " +
        "IF NEW.satellites > 0 THEN " +
        "SET valid = 1; " +
        "SET invalid = 0; " +
        "ELSE " +
        "SET valid = 0; " +
        "SET invalid = 1; " +
        "END IF; " +
        "INSERT INTO gps_statistic (imei, date, number_valid, number_invalid) VALUES(NEW.imei, NEW.timestamp, valid, invalid) " +
        "ON DUPLICATE KEY UPDATE imei=VALUES(imei), date=VALUES(date), number_valid = number_valid + valid, number_invalid = number_invalid + invalid; " +
        "END;"
    );

    query.on('error', function(err) {
        errorCallback(err);
    });
}


function tableCreate(flags, errorCallback) {
    var force = false;
    var table = models.sequelize;

    for(index in flags) {

        if (flags[index] == "-force") {
            force = true;
        }
        else if (models.models.indexOf(flags[index]) !== -1) {
            table = models[flags[index]];
        }
        else {
            errorCallback(Error(flags[index] + "flag" + "not found"));
        }
    }

    table.sync({force: force});
    errorCallback(null);
}


module.exports.commands = commands;
