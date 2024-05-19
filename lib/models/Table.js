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
    'chart:trigger:create': {
        "run": chartTrigger,
        description: "This command is used to create a trigger for charts"
    },
    'statistic:trigger:create': {
        "run": statisticTrigger,
        description: "This command is used to create statistic triggers"
    }
};


function chartTrigger(flags, errorCallback)
{
    var sequelize = models.sequelize;
    var query = sequelize.query(
        "CREATE TRIGGER AFTER_gps_info_INSERT AFTER INSERT " +
        "ON gps_info FOR EACH ROW " +
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


function statisticTrigger(flags, errorCallback)
{
    var sequelize = models.sequelize;
    var query = sequelize.query(
        "CREATE TRIGGER AFTER_gps_info_statistic_INSERT AFTER INSERT " +
        "ON gps_info FOR EACH ROW " +
        "BEGIN " +

        //============================================================ Chart part =======================================================================
        "DECLARE valid INT DEFAULT 0; " +
        "DECLARE invalid INT  DEFAULT 0; " +
        //================================================================================================================================================

        "DECLARE fromSectionPart INT; " +
        "DECLARE fromSectionOrder INT; " +

        "DECLARE toSectionPart INT; " +
        "DECLARE toSectionOrder INT; " +

        "DECLARE timeToPass FLOAT; " +
        "DECLARE routeId INT; " +

        "DECLARE minIsAsc INT; " +
        "DECLARE maxIsAsc INT; " +

        "DECLARE temp INT; " +

        "DECLARE lastInfoId INT; " +


        //============================================================ Chart part =======================================================================
        "IF NEW.satellites > 0 THEN " +
        "SET valid = 1; " +
        "SET invalid = 0; " +
        "ELSE " +
        "SET valid = 0; " +
        "SET invalid = 1; " +
        "END IF; " +
        "INSERT INTO gps_statistic (imei, date, number_valid, number_invalid) VALUES(NEW.imei, NEW.timestamp, valid, invalid) " +
        "ON DUPLICATE KEY UPDATE imei=VALUES(imei), date=VALUES(date), number_valid = number_valid + valid, number_invalid = number_invalid + invalid; " +
        //================================================================================================================================================



        "SET routeId = NEW.route_id; " +

        "SET lastInfoId = (SELECT b.last_record_id " +
        "FROM bus_last_info_id as b " +
        "JOIN gps_info as i ON i.id = b.last_record_id AND i.route_id = routeId " +
        "WHERE b.imei = NEW.imei); " +

        "IF (lastInfoId IS NOT NULL) THEN " +

        "SET fromSectionPart = (SELECT i.section_part_id " +
        "FROM gps_info as i " +
        "WHERE i.id = lastInfoId); " +

        "SET fromSectionOrder = (SELECT rs.section_order " +
        "FROM `bus-way`.route_section as rs " +
        "JOIN `bus-way`.section_part as sp ON sp.section_id = rs.section_id " +
        "AND rs.route_id = routeId " +
        "AND sp.id = fromSectionPart); " +

        "SET toSectionPart = NEW.section_part_id; " +
        "SET toSectionOrder  =  (SELECT rs.section_order " +
        "FROM `bus-way`.route_section as rs " +
        "JOIN `bus-way`.section_part as sp ON sp.section_id = rs.section_id " +
        "AND rs.route_id = routeId " +
        "AND sp.id = toSectionPart); " +


        "IF (fromSectionOrder > toSectionOrder) THEN " +
        "SET temp = fromSectionOrder; " +
        "SET fromSectionOrder = toSectionOrder; " +
        "SET toSectionOrder = temp; " +

        "SET temp = fromSectionPart; " +
        "SET fromSectionPart = toSectionPart; " +
        "SET toSectionPart = temp; " +
        "END IF;" +

        "SET timeToPass = (SELECT abs(NEW.timestamp - i.timestamp) " +
        "FROM gps_info as i " +
        "WHERE i.id = lastInfoId); " +

        "SET minIsAsc = isAsc(fromSectionPart, routeId); " +
        "SET maxIsAsc = isAsc(toSectionPart, routeId); " +

        "INSERT statistic (section_part_id, interval_to_pass) " +
        "SELECT sp.id, (timeToPass / data.cnt) " +
        "FROM `bus-way`.section_part as sp " +
        "JOIN `bus-way`.section as s ON s.id = sp.section_id " +
        "JOIN `bus-way`.route_section as rs ON rs.section_id = s.id " +

        //Used to calculate the count of passed section parts
        "JOIN (SELECT COUNT(*) as cnt " +
        "FROM `bus-way`.section_part as sp " +
        "JOIN `bus-way`.section as s ON s.id = sp.section_id " +
        "JOIN `bus-way`.route_section as rs ON rs.section_id = s.id " +
        "WHERE ((rs.section_order > fromSectionOrder AND rs.section_order < toSectionOrder) " +
        "OR (rs.section_order = fromSectionOrder AND fromSectionOrder != toSectionOrder " +
        "AND CAST(fromSectionPart AS SIGNED) * minIsAsc <= sp.id * minIsAsc) " +
        "OR (rs.section_order = toSectionOrder AND fromSectionOrder != toSectionOrder " +
        "AND CAST(toSectionPart AS SIGNED) * maxIsAsc >= sp.id * maxIsAsc) " +
        "OR (rs.section_order = toSectionOrder AND fromSectionOrder = toSectionOrder " +
        "AND CAST(toSectionPart AS SIGNED) * maxIsAsc >= sp.id * maxIsAsc " +
        "AND CAST(fromSectionPart AS SIGNED) * minIsAsc <= sp.id * minIsAsc)) " +
        "AND rs.route_id = routeId) as data ON TRUE " +

        "WHERE ((rs.section_order > fromSectionOrder AND rs.section_order < toSectionOrder) " +
        "OR (rs.section_order = fromSectionOrder AND fromSectionOrder != toSectionOrder " +
        "AND CAST(fromSectionPart AS SIGNED) * minIsAsc <= sp.id * minIsAsc) " +

        "OR (rs.section_order = toSectionOrder AND fromSectionOrder != toSectionOrder " +
        "AND CAST(toSectionPart AS SIGNED) * maxIsAsc >= sp.id * maxIsAsc) " +

        "OR (rs.section_order = toSectionOrder AND fromSectionOrder = toSectionOrder " +
        "AND CAST(toSectionPart AS SIGNED) * maxIsAsc >= sp.id * maxIsAsc " +
        "AND CAST(fromSectionPart AS SIGNED) * minIsAsc <= sp.id * minIsAsc)) " +

        "AND rs.route_id = routeId; " +
        "END IF; " +

        "INSERT INTO bus_last_info_id (imei,last_record_id) " +
        "VALUES (NEW.imei, NEW.id) " +
        "ON DUPLICATE KEY UPDATE " +
        "last_record_id = VALUES(last_record_id); " +

        "END; ");

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
