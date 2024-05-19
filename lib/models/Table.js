/**
 * Created by andranik on 3/24/15.
 */

var models    = require('./index');
var sequelize = require('./Sequelize');

var commands = {
    'table:create': {
        "run": tableCreate,
        "flags": {
            "-force": "To drop an existing tables and create new tables"
        },
        description: "This commands is used to create tables \n\tflags: -force To drop an existing tables and create new tables "
    },
    'raw:statistic:trigger:create': {
        "run": rawStatisticTrigger,
        description: "This command is used to create raw statistic triggers"
    },
    'statistic:trigger:create': {
        "run": statisticTrigger,
        description: "This command is used to create statistic triggers"
    }
};

function statisticTrigger(flags, errorCallback)
{
    var query = sequelize.query(
        "CREATE TRIGGER AFTER_raw_statistic_INSERT AFTER INSERT " +
        "ON raw_statistic FOR EACH ROW " +
        "BEGIN " +
        "INSERT INTO statistic (section_part_id, pass_times_sum, pass_count, route_id, statistic_mode_code) " +
        "VALUES (NEW.section_part_id, NEW.interval_to_pass, 1, NEW.route_id, NEW.statistic_mode_code) " +
        "ON DUPLICATE KEY UPDATE " +
        "pass_times_sum = pass_times_sum + VALUES(pass_times_sum), " +
        "pass_count = pass_count + 1; " +
        "END; ");
}


function rawStatisticTrigger(flags, errorCallback)
{
    var query = sequelize.query(
        "CREATE TRIGGER AFTER_gps_data_statistic_INSERT AFTER INSERT " +
        "ON gps_data FOR EACH ROW " +
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

        "END; ");
}


//function rawStatisticTrigger(flags, errorCallback)
//{
//    var query = sequelize.query(
//        "CREATE TRIGGER AFTER_gps_data_statistic_INSERT AFTER INSERT " +
//        "ON gps_data FOR EACH ROW " +
//        "BEGIN " +
//
//        //============================================================ Chart part =======================================================================
//        "DECLARE valid INT DEFAULT 0; " +
//        "DECLARE invalid INT  DEFAULT 0; " +
//        //================================================================================================================================================
//
//        "DECLARE fromSectionPart INT; " +
//        "DECLARE fromSectionOrder INT; " +
//
//        "DECLARE toSectionPart INT; " +
//        "DECLARE toSectionOrder INT; " +
//
//        "DECLARE timeToPass FLOAT; " +
//        "DECLARE routeId INT; " +
//
//        "DECLARE temp INT; " +
//
//        "DECLARE lastInfoId INT; " +
//
//
//        //============================================================ Chart part =======================================================================
//        "IF NEW.satellites > 0 THEN " +
//        "SET valid = 1; " +
//        "SET invalid = 0; " +
//        "ELSE " +
//        "SET valid = 0; " +
//        "SET invalid = 1; " +
//        "END IF; " +
//        "INSERT INTO gps_statistic (imei, date, number_valid, number_invalid) VALUES(NEW.imei, NEW.timestamp, valid, invalid) " +
//        "ON DUPLICATE KEY UPDATE imei=VALUES(imei), date=VALUES(date), number_valid = number_valid + valid, number_invalid = number_invalid + invalid; " +
//        //================================================================================================================================================
//
//
//
//        "SET routeId = NEW.route_id; " +
//
//        "SET lastInfoId = (SELECT b.last_record_id " +
//        "FROM bus_last_info_id as b " +
//        "JOIN gps_data as i ON i.id = b.last_record_id AND i.route_id = routeId " +
//        "WHERE b.imei = NEW.imei); " +
//
//        "IF (lastInfoId IS NOT NULL) THEN " +
//
//        "SET fromSectionPart = (SELECT i.section_part_id " +
//        "FROM gps_data as i " +
//        "WHERE i.id = lastInfoId); " +
//
//        "IF (fromSectionPart != NEW.section_part_id) THEN " +
//
//        "SET fromSectionOrder = (SELECT rs.section_order " +
//        "FROM route_section as rs " +
//        "JOIN section_part as sp ON sp.section_id = rs.section_id " +
//        "AND rs.route_id = routeId " +
//        "AND sp.id = fromSectionPart); " +
//
//        "SET toSectionPart = NEW.section_part_id; " +
//        "SET toSectionOrder  =  (SELECT rs.section_order " +
//        "FROM route_section as rs " +
//        "JOIN section_part as sp ON sp.section_id = rs.section_id " +
//        "AND rs.route_id = routeId " +
//        "AND sp.id = toSectionPart); " +
//
//
//        "IF (fromSectionOrder > toSectionOrder) THEN " +
//        "SET temp = fromSectionOrder; " +
//        "SET fromSectionOrder = toSectionOrder; " +
//        "SET toSectionOrder = temp; " +
//
//        "SET temp = fromSectionPart; " +
//        "SET fromSectionPart = toSectionPart; " +
//        "SET toSectionPart = temp; " +
//        "END IF;" +
//
//        "SET timeToPass = (SELECT TIMESTAMPDIFF(SECOND, i.timestamp, NEW.timestamp) " +
//        "FROM gps_data as i " +
//        "WHERE i.id = lastInfoId); " +
//
//        "IF (timeToPass > 0 AND timeToPass < 300) THEN " +
//
//        "INSERT raw_statistic (section_part_id, interval_to_pass, route_id, statistic_mode_code) " +
//        "SELECT sp.id, (timeToPass / data.cnt), routeId, NEW.statistic_mode_code " +
//        "FROM section_part as sp " +
//        "JOIN section as s ON s.id = sp.section_id " +
//        "JOIN route_section as rs ON rs.section_id = s.id " +
//
//        //Used to calculate the count of passed section parts
//        "JOIN (SELECT COUNT(*) as cnt " +
//        "FROM section_part as sp " +
//        "JOIN section as s ON s.id = sp.section_id " +
//        "JOIN route_section as rs ON rs.section_id = s.id " +
//        "WHERE ((rs.section_order > fromSectionOrder AND rs.section_order < toSectionOrder) " +
//        "OR (rs.section_order = fromSectionOrder AND fromSectionOrder != toSectionOrder " +
//        "AND CAST(fromSectionPart AS SIGNED) * rs.direction <= sp.id * rs.direction) " +
//        "OR (rs.section_order = toSectionOrder AND fromSectionOrder != toSectionOrder " +
//        "AND CAST(toSectionPart AS SIGNED) * rs.direction >= sp.id * rs.direction) " +
//        "OR (rs.section_order = toSectionOrder AND fromSectionOrder = toSectionOrder " +
//        "AND CAST(toSectionPart AS SIGNED) * rs.direction >= sp.id * rs.direction " +
//        "AND CAST(fromSectionPart AS SIGNED) * rs.direction <= sp.id * rs.direction)) " +
//        "AND rs.route_id = routeId) as data ON TRUE " +
//
//        "WHERE ((rs.section_order > fromSectionOrder AND rs.section_order < toSectionOrder) " +
//        "OR (rs.section_order = fromSectionOrder AND fromSectionOrder != toSectionOrder " +
//        "AND CAST(fromSectionPart AS SIGNED) * rs.direction <= sp.id * rs.direction) " +
//
//        "OR (rs.section_order = toSectionOrder AND fromSectionOrder != toSectionOrder " +
//        "AND CAST(toSectionPart AS SIGNED) * rs.direction >= sp.id * rs.direction) " +
//
//        "OR (rs.section_order = toSectionOrder AND fromSectionOrder = toSectionOrder " +
//        "AND CAST(toSectionPart AS SIGNED) * rs.direction >= sp.id * rs.direction " +
//        "AND CAST(fromSectionPart AS SIGNED) * rs.direction <= sp.id * rs.direction)) " +
//
//        "AND rs.route_id = routeId; " +
//        "END IF; " +
//        "END IF; " +
//        "END IF; " +
//
//        "IF (lastInfoId IS NULL OR fromSectionPart != NEW.section_part_id) THEN " +
//        "INSERT INTO bus_last_info_id (imei,last_record_id) " +
//        "VALUES (NEW.imei, NEW.id) " +
//        "ON DUPLICATE KEY UPDATE " +
//        "last_record_id = VALUES(last_record_id); " +
//        "END IF; " +
//
//        "END; ");
//}



function tableCreate(flags, errorCallback) {
    var force = false;
    var table = sequelize;

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
