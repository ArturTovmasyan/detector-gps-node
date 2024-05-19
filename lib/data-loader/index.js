var loader = require("./loader");


//======================================================================================================================

buses_event = null;

/**
 * @param imei
 * @returns {*}
 */
function findBusByImei(imei){

    var bus = loader.buses[imei];

    if (!bus) {
        if (!buses_event) {
            buses_event = loader.loadBuses();
        }
        throw new Error("Buses yet didn't loaded. You can try after few minutes");
    }

    return bus;
}

module.exports.findBusByImei = findBusByImei;


//======================================================================================================================

/**
 * @param imei
 * @returns {*}
 */
function findLineByImei(imei){

    var line_number = loader.buses[imei] ? loader.buses[imei].line_number : null;
    //If lines didn't loaded then return error with corresponding message
    if (!line_number) {
        if (!buses_event) {
            buses_event = loader.loadBuses();
        }
        throw new Error("Imei lines yet didn't loaded, or line with " + imei + " imei not found. You can try after few minutes");
    }

    return line_number;
}

module.exports.findLineByImei = findLineByImei;


//======================================================================================================================

/**
 * @param imei
 * @returns {*}
 */
function findBuses(){

    if (!loader.buses) {
        if (!buses_event) {
            buses_event = loader.loadBuses();
        }
        throw new Error("Buses yet didn't loaded. You can try after few minutes");
    }

    return loader.buses;
}

module.exports.findBuses = findBuses;

//======================================================================================================================

lines_event = null;

/**
 * @param line_number
 * @returns {null|*}
 */
function findLineRoutes(line_number){

    var line = loader.lines[line_number];
    //If line's section parts didn't loaded then start to load and return error with corresponding message
    if (!line) {
        if (!lines_event) {
            lines_event = loader.loadLines();
        }
        throw new Error("Lines yet didn't loaded. You can try after few minutes");
    }

    return line.routes;
}

module.exports.findLineRoutes = findLineRoutes;

//======================================================================================================================

var section_part_event = [];

/**
 * @param line_number
 * @returns {*}
 */
function findSectionPartsByLine(line_number){

    var section_parts = loader.section_parts[line_number];
    //If line's section parts didn't loaded then start to load and return error with corresponding message
    if (!section_parts) {
        if (!section_part_event[line_number]) {
            section_part_event[line_number] = loader.loadLineSectionParts(line_number);
        }
        throw new Error(line_number + " section_parts yet didn't loaded. You can try after few minutes");
    }

    return section_parts;
}

module.exports.findSectionPartsByLine = findSectionPartsByLine;

//======================================================================================================================

section_event = [];

/**
 * @param line_number
 * @returns {*}
 */
function findSectionsByLine(line_number){

    var sections = loader.sections[line_number];
    //If line's section parts didn't loaded then start to load and return error with corresponding message
    if (!sections) {
        if (!section_event[line_number]) {
            section_event[line_number] = loader.loadLineSections(line_number);
        }
        throw new Error(line_number + " section yet didn't loaded. You can try after few minutes");
    }

    return sections;
}

module.exports.findSectionsByLine = findSectionsByLine;

//======================================================================================================================

var statistic_mode_event = null;

/**
 * @returns {*}
 */
function getStatisticMode()
{
    //TODO: save last time to change mode
    //If line's section parts didn't loaded then start to load and return error with corresponding message
    if (!loader.statistic_mode) {
        if (!statistic_mode_event) {
            statistic_mode_event = loader.loadStatisticMode();
        }
        throw new Error("Statistic mode yet didn't loaded. You can try after few minutes");
    }

    return loader.statistic_mode;
}

//Load statistic mode each 1 hour
setInterval(function(){
    loader.loadStatisticMode();
}, 360000);

module.exports.getStatisticMode = getStatisticMode;

//======================================================================================================================

var sectionPartsOrders    = {};
var sectionPartsStatistic = {};

var sequelize = require('../models/Sequelize');

var section_parts_order_event     = null;
var section_parts_statistic_event = null;

/**
 *
 * @param routeId
 * @returns {{}}
 */
function getSectionPartsOrders(routeId) {

    if (sectionPartsOrders[routeId].length) {
        return sectionPartsOrders;
    }

    if (!section_parts_order_event) {

        section_parts_order_event = sequelize
            .query("SELECT sp.id " +
                   "FROM section as s " +
                   "JOIN section_part as sp ON sp.section_id = s.id " +
                   "JOIN route_section as rs ON rs.section_id = s.id " +
                   "WHERE rs.route_id = " + routeId + " " +
                   "ORDER BY rs.section_order, sp.order * rs.direction",
                   {type: sequelize.QueryTypes.SELECT})
        .then(function (results) {
            sectionPartsOrders[routeId] = results;
        });
    }

    throw new Error("Section part orders yet didn't loaded");
}


/**
 *
 * @param routeId
 * @returns {{}}
 */
function getSectionPartsStatistic(routeId) {

    if (sectionPartsStatistic[routeId] && sectionPartsStatistic[routeId].length) {
        return sectionPartsStatistic;
    }

    if (!section_parts_statistic_event) {

        section_parts_statistic_event = sequelize
             .query("set @order=0; " +
                    "set @order1=0; " +

                    "select t1.num, t1.stop_id, " +

                    " (select SUM(t2.pass_time) " +
                    "from " +
                    "(select @order1:=@order1+1 as num, t.pass_time " +
                    "from " +
                    "(select sp.id, st.stop_id as stop_id, (stat.pass_times_sum / stat.pass_count) as pass_time " +
                    "from section as s " +
                    "join section_part as sp on sp.section_id = s.id " +
                    "join route_section as rs on rs.section_id = s.id " +

                    "left join (select ssp.section_part_id as section_part_id, ssp.stop_id as stop_id, rst.route_id as route_id from route_stop as rst join stop_section_part as ssp on ssp.stop_id = rst.stop_id) as st " +
                    "on st.section_part_id = sp.id and st.route_id = rs.route_id " +

                    "left join statistic as stat on stat.section_part_id = sp.id and stat.route_id = rs.route_id " +

                    "where rs.route_id = " + routeId + " " +
                    "order by rs.section_order, sp.order * rs.direction) as t) as t2 " +
                    "where t2.num <= t1.num) as pass_count " +

                    "from " +
                    "(select @order:=@order+1 as num, t.id, t.stop_id, t.pass_time " +
                    "from " +
                    "(select sp.id, st.stop_id as stop_id, (stat.pass_times_sum / stat.pass_count) as pass_time " +
                    "from section as s " +
                    "join section_part as sp on sp.section_id = s.id " +
                    "join route_section as rs on rs.section_id = s.id " +

                    "left join (select ssp.section_part_id as section_part_id, ssp.stop_id as stop_id, rst.route_id as route_id from route_stop as rst join stop_section_part as ssp on ssp.stop_id = rst.stop_id) as st " +
                    "on st.section_part_id = sp.id and st.route_id = rs.route_id " +

                    "left join statistic as stat on stat.section_part_id = sp.id and stat.route_id = rs.route_id " +

                    "where rs.route_id = " + routeId + " " +
                    "order by rs.section_order, sp.order * rs.direction) as t) as t1 "
            , {type: sequelize.QueryTypes.SELECT})
            .then(function (results) {
                sectionPartsStatistic[routeId] = results;
            });
    }

    throw new Error("Section part statistic yet didn't loaded");
}


module.exports.getSectionPartsStatistic = getSectionPartsStatistic;
module.exports.getSectionPartsOrders    = getSectionPartsOrders;


/*

set @order=0;
set @order1=0;

select t1.num, t1.stop_id,

(select SUM(t2.pass_time)
from
 (select @order1:=@order1+1 as num, t.pass_time
 from
 (select sp.id, st.stop_id as stop_id, (stat.pass_times_sum / stat.pass_count) as pass_time
 from section as s
 join section_part as sp on sp.section_id = s.id
 join route_section as rs on rs.section_id = s.id

 left join (select ssp.section_part_id as section_part_id, ssp.stop_id as stop_id, rst.route_id as route_id from route_stop as rst join stop_section_part as ssp on ssp.stop_id = rst.stop_id) as st
 on st.section_part_id = sp.id and st.route_id = rs.route_id

 left join statistic as stat on stat.section_part_id = sp.id and stat.route_id = rs.route_id

 where rs.route_id = 9
 order by rs.section_order, sp.order * rs.direction) as t) as t2
where t2.num <= t1.num) as pass_count


from
    (select @order:=@order+1 as num, t.id, t.stop_id, t.pass_time
     from
     (select sp.id, st.stop_id as stop_id, (stat.pass_times_sum / stat.pass_count) as pass_time
     from section as s
     join section_part as sp on sp.section_id = s.id
     join route_section as rs on rs.section_id = s.id

     left join (select ssp.section_part_id as section_part_id, ssp.stop_id as stop_id, rst.route_id as route_id from route_stop as rst join stop_section_part as ssp on ssp.stop_id = rst.stop_id) as st
     on st.section_part_id = sp.id and st.route_id = rs.route_id

     left join statistic as stat on stat.section_part_id = sp.id and stat.route_id = rs.route_id

     where rs.route_id = 9
     order by rs.section_order, sp.order * rs.direction) as t) as t1

 */



/*

 SELECT sp.id
 FROM section as s
 JOIN section_part as sp ON sp.section_id = s.id
 JOIN route_section as rs ON rs.section_id = s.id
 WHERE rs.route_id = 9
 ORDER BY rs.section_order, sp.order * rs.direction

 */