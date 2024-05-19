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

    if (Object.keys(loader.buses).length === 0) {
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
    //If line's section parts didn't loaded then start to load and return error with corresponding message
    if (!loader.statistic_mode) {
        if (!statistic_mode_event) {
            statistic_mode_event = loader.loadStatisticMode();
        }
        throw new Error("Statistic mode yet didn't loaded. You can try after few minutes");
    }

    return loader.statistic_mode;
}

/**
 * @param interval
 */
function setStatisticModeLoadingInterval(interval)
{
    //Load statistic mode each 1 hour
    setInterval(function(){
        loader.loadStatisticMode();
        console.log('Load new statistic mode!!');
    }, interval);
}


module.exports.getStatisticMode                = getStatisticMode;
module.exports.setStatisticModeLoadingInterval = setStatisticModeLoadingInterval;

//======================================================================================================================

var sequelize = require('../models/Sequelize');

var sectionPartsOrders            = {};
var section_parts_order_event     = {};
var lastSectionPartsOrders        = {};

/**
 *
 * @param routeId
 * @returns {*}
 */
function getSectionPartsOrders(routeId) {

    if (sectionPartsOrders[routeId] && sectionPartsOrders[routeId].length) {
        return sectionPartsOrders[routeId];
    }

    if (!section_parts_order_event[routeId]) {

        section_parts_order_event[routeId] = sequelize
            .query("SELECT sp.id " +
                   "FROM section as s " +
                   "JOIN section_part as sp ON sp.section_id = s.id " +
                   "JOIN route_section as rs ON rs.section_id = s.id " +
                   "WHERE rs.route_id = " + routeId + " " +
                   "ORDER BY rs.section_order, sp.order * rs.direction",
                   {type: sequelize.QueryTypes.SELECT})
        .then(function (results) {
            sectionPartsOrders[routeId] = results;
            lastSectionPartsOrders[routeId] = sectionPartsOrders[routeId];
        })
        .error(function(err) {
            console.error(err.message);
        });
    }

    if (lastSectionPartsOrders[routeId]){
        return lastSectionPartsOrders[routeId];
    }

    throw new Error(routeId + " Section part orders yet didn't loaded");
}

var sectionPartsStatistic         = {};
var section_parts_statistic_event = {};
var lastModeSectionPartsStatistic = {};

/**
 *
 * @param routeId
 * @param withoutTimeout
 * @returns {*}
 */
function getSectionPartsStatistic(routeId, withoutTimeout) {

    var statisticModeCode = getStatisticMode();

    if (sectionPartsStatistic[routeId] && sectionPartsStatistic[routeId][statisticModeCode] && sectionPartsStatistic[routeId][statisticModeCode].length) {
        return sectionPartsStatistic[routeId][statisticModeCode];
    }

    if (!section_parts_statistic_event[routeId] || !section_parts_statistic_event[routeId][statisticModeCode]) {

        section_parts_statistic_event[routeId] = {};


        section_parts_statistic_event[routeId][statisticModeCode] =
            sequelize.query("select sp.id, st.stop_id as stop_id, (stat.pass_times_sum / stat.pass_count) as pass_time " +
                        "from section as s " +
                        "join section_part as sp on sp.section_id = s.id " +
                        "join route_section as rs on rs.section_id = s.id " +

                        "left join (select ssp.section_part_id as section_part_id, ssp.stop_id as stop_id, rst.route_id as route_id from route_stop as rst join stop_section_part as ssp on ssp.stop_id = rst.stop_id) as st " +
                        "on st.section_part_id = sp.id and st.route_id = rs.route_id " +

                        "left join statistic as stat on stat.section_part_id = sp.id and stat.route_id = rs.route_id and stat.statistic_mode_code = '" + statisticModeCode + "' " +

                        "where rs.route_id = " + routeId + " " +
                        "order by rs.section_order, sp.order * rs.direction "
                , {type: sequelize.QueryTypes.SELECT})
            .then(function (results) {

                sectionPartsStatistic[routeId] = {};
                sectionPartsStatistic[routeId][statisticModeCode] = results;
                lastModeSectionPartsStatistic[routeId] = sectionPartsStatistic[routeId][statisticModeCode];

                sequelize.query("SELECT MIN(pass_count) as min_cnt FROM statistic WHERE route_id = " + routeId + " and statistic_mode_code = '" + statisticModeCode + "'",
                    {type: sequelize.QueryTypes.SELECT})
                .then(function(result) {
                    var intervalToLoad = 0;
                    if (result[0].min_cnt < 100){
                        intervalToLoad = 3600000;
                    }
                    else if(result[0].min_cnt < 1000){
                        intervalToLoad = 24 * 3600000;
                    }
                    else {
                        intervalToLoad = 7 * 24 * 3600000;
                    }

                    if (!withoutTimeout) {
                        setTimeout(function () {
                            console.log(process.pid + '___ Reload statistic .... for: ', routeId);
                            sectionPartsStatistic[routeId] = {};
                            section_parts_statistic_event[routeId] = {};
                        }, intervalToLoad);
                    }
                });
            })
            .error(function(err) {
                console.error(err.message);
            });
    }

    if (lastModeSectionPartsStatistic[routeId]) {
        return lastModeSectionPartsStatistic[routeId];
    }

    throw new Error(routeId + " Section part " + statisticModeCode + " statistic yet didn't loaded");
}

module.exports.getSectionPartsStatistic = getSectionPartsStatistic;
module.exports.getSectionPartsOrders    = getSectionPartsOrders;



//======================================================================================================================

function reload()
{
    loader.reload();
    sectionPartsOrders            = {};
    section_parts_order_event     = {};
    sectionPartsStatistic         = {};
    section_parts_statistic_event = {};
}

module.exports.reload = reload;


//======================================================================================================================

/*

set @order=0;
set @order1=0;

select t1.num, t1.id, t1.stop_id,

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

 left join statistic as stat on stat.section_part_id = sp.id and stat.route_id = rs.route_id and stat.statistic_mode_code = 'Sum_unpic'

 where rs.route_id = 15
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

     left join statistic as stat on stat.section_part_id = sp.id and stat.route_id = rs.route_id and stat.statistic_mode_code = 'Sum_unpic'

     where rs.route_id = 15
     order by rs.section_order, sp.order * rs.direction) as t) as t1

 */



/*

 SELECT sp.id
 FROM section as s
 JOIN section_part as sp ON sp.section_id = s.id
 JOIN route_section as rs ON rs.section_id = s.id
 WHERE rs.route_id = 8
 ORDER BY rs.section_order, sp.order * rs.direction

 */


/*

 set @order17=0;
 set @order117=0;

 select t1.num, t1.stop_id,
  (select SUM(t2.pass_time)
 from
 (select @order117:=@order117+1 as num, t.pass_time
 from

 (select sp.id, st.stop_id as stop_id, (stat.pass_times_sum / stat.pass_count) as pass_time
 from section as s
 join section_part as sp on sp.section_id = s.id
 join route_section as rs on rs.section_id = s.id

 left join (select ssp.section_part_id as section_part_id, ssp.stop_id as stop_id, rst.route_id as route_id from route_stop as rst join stop_section_part as ssp on ssp.stop_id = rst.stop_id) as st
 on st.section_part_id = sp.id and st.route_id = rs.route_id

 left join statistic as stat on stat.section_part_id = sp.id and stat.route_id = rs.route_id and stat.statistic_mode_code = 'Sum_pic'

 where rs.route_id = 17
 order by rs.section_order, sp.order * rs.direction) as t) as t2
 where t2.num <= t1.num) as pass_time

 from
 (select @order17:=@order17+1 as num, t.id, t.stop_id, t.pass_time
 from
 (select sp.id, st.stop_id as stop_id, (stat.pass_times_sum / stat.pass_count) as pass_time
 from section as s
 join section_part as sp on sp.section_id = s.id
 join route_section as rs on rs.section_id = s.id

 left join (select ssp.section_part_id as section_part_id, ssp.stop_id as stop_id, rst.route_id as route_id from route_stop as rst join stop_section_part as ssp on ssp.stop_id = rst.stop_id) as st
 on st.section_part_id = sp.id and st.route_id = rs.route_id

 left join statistic as stat on stat.section_part_id = sp.id and stat.route_id = rs.route_id and stat.statistic_mode_code = 'Sum_pic'

 where rs.route_id = 17
 order by rs.section_order, sp.order * rs.direction) as t) as t1


 */