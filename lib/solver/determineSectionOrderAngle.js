/**
 * Created by andranik on 6/15/15.
 */

var loader            = require("../data-loader");
var cache             = require("memory-cache");
var cache_conf        = require("../../config/parameters").cache;

function determineSectionOrderAngle(imei, routeId, sectionId)
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
            return {"order": lastSectionOrder.order, "angle": lastSectionOrder.angle}
        }
        else {
            cache.del('determineSectionOrder_' + imei);
        }
    }

    var line_number = loader.findLineByImei(imei);
    var sections    = loader.findSectionsByLine(line_number);

    for (var key in sections[sectionId].route_section){
        var routeSection = sections[sectionId].route_section[key];
        if (routeSection.route.id == routeId){
            cache.put('determineSectionOrder_' + imei, {"route_id": routeId, "order": routeSection.order, "angle": routeSection.direction * sections[sectionId].angle}, cache_conf.expiration_time);
            return {"order": routeSection.order, "angle": routeSection.direction * sections[sectionId].angle};
        }
    }

    return null;
}


module.exports.determineSectionOrderAngle = determineSectionOrderAngle;