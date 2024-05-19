/**
 * Created by andranik on 6/15/15.
 */

var loader            = require("../data-loader");
var cache             = require("memory-cache");
var cache_conf        = require("../../config/parameters").cache;

function determineSectionOrder(imei, routeId, sectionId)
{
    if (!imei || !routeId){
        return null;
    }

    if (!sectionId){
        var lastSectionOrder = cache.get('determineSectionOrder_' + imei);
        if (!lastSectionOrder){
            return null;
        }

        if (lastSectionOrder.route_id == routeId){
            return lastSectionOrder.section_order;
        }
        else {
            cache.del('determineSectionOrder_' + imei);
        }
    }

    var line_number = loader.findLineByImei(imei);
    var sections    = loader.findSectionsByLine(line_number);

    sections[sectionId].route_section.forEach(function (routeSection) {
        console.log("routeSection.route.id: ", routeSection.route.id, "routeSection.section_order: ", routeSection.section_order);
        if (routeSection.route.id == routeId){
            cache.put('determineSectionOrder_' + imei, {"route_id": routeId, "section_order": routeSection.section_order}, cache_conf.expiration_time);
            return routeSection.section_order;
        }
    });

    return null;
}


module.exports.determineSectionOrder = determineSectionOrder;