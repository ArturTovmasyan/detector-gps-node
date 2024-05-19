'use strict';

$(document).ready(function(){

    function mapInit(){
        var m,data = {};
        data.center = new google.maps.LatLng(40.1770,44.5148);
        data.zoom = 12;
        data.panControl = false;
        data.zoomControl = false;
        data.streetViewControl = false;
        data.mapTypeId = google.maps.MapTypeId.ROADMAP;
        m = new google.maps.Map($('#map')[0],data);
        return m;
    }
    var map = mapInit();

    var socket = io();
    var markers = [];
    var markersCount = 0;

    //For polylines
    var polylines               = {};
    var section_parts           = {};
    var bus_polylines           = {};
    var bus_section_part_marker = {};
    var choosenSectionPart      = null;
    var lineRoutes              = {};

    socket
        .on('connect', function (){
            console.log('socket connected...');
        })
        .on('disconnect',function(){
            console.log('socket disconnected...');
        })
        .on('message',function(msg){
            var gpsData     = msg.busInfo.gpsData;
            var sectionPart = msg.busInfo.sectionPart;
            var routeId     = gpsData.route_id ? gpsData.route_id.toString() : "";


            if (!lineRoutes[msg.busInfo.lineNumber] || lineRoutes[msg.busInfo.lineNumber][0] == 0 || lineRoutes[msg.busInfo.lineNumber][1] == 0) {
                lineRoutes[msg.busInfo.lineNumber] = {};
                lineRoutes[msg.busInfo.lineNumber][0] = msg.busInfo.routes && msg.busInfo.routes[0] ? msg.busInfo.routes[0].id : 0;
                lineRoutes[msg.busInfo.lineNumber][1] = msg.busInfo.routes && msg.busInfo.routes[1] ? msg.busInfo.routes[1].id : 0;
            }

            //if (bus_polylines[gpsData.imei]) {
            //    bus_polylines[gpsData.imei].setOptions({strokeColor: '#FF0000'});
            //}

            if (!sectionPart && bus_section_part_marker[gpsData.imei]){
                bus_section_part_marker[gpsData.imei].setMap(null);
            }

            //If there are section part and corresponding section's polyline select it
            if (sectionPart && polylines[sectionPart.section.id]) {

                //Select corresponding polyline and save it in the bus_polylines object
                //polylines[sectionPart.section.id].setOptions({strokeColor: 'blue'});
                bus_polylines[gpsData.imei] = polylines[sectionPart.section.id];

                //Create marker on the nearest section part center
                pos = new google.maps.LatLng(sectionPart.latitude, sectionPart.longitude);
                if (bus_section_part_marker[gpsData.imei]){
                    bus_section_part_marker[gpsData.imei].setPosition(pos);
                }
                else {
                    //Collect markers in the bus_section_part_marker object
                    bus_section_part_marker[gpsData.imei] = new google.maps.Marker({
                        position: pos,
                        icon: "http://maps.gstatic.com/mapfiles/ridefinder-images/mm_20_orange.png"
                    });
                }

                bus_section_part_marker[gpsData.imei].setMap(map);
            }


            var lineNumber = msg.busInfo.lineNumber ? msg.busInfo.lineNumber : '';
            var busIcon = "/images/redIcons/marker" + lineNumber + ".png";
            if (msg.busInfo.busStatus == "on_line"){
                if (routeId == lineRoutes[msg.busInfo.lineNumber][0]){
                    busIcon = "/images/blueIcons/marker" + lineNumber + ".png";
                }
                else if (routeId == lineRoutes[msg.busInfo.lineNumber][1]){
                    busIcon = "/images/greenIcons/marker" + lineNumber + ".png";
                }
            }
            else if (msg.busInfo.busStatus == "no_data"){
                busIcon = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
            }


            //Create bus marker to show bus place on the map
            var pos = new google.maps.LatLng(gpsData.latitude / 10000000, gpsData.longitude / 10000000);
            if(!markers[gpsData.imei]) {
                var marker = new google.maps.Marker({
                    position: pos,
                    title:    'imei:' + gpsData.imei + '\nspeed:' + gpsData.speed + '\nplateNumber:' + msg.busInfo.plateNumber +'\nrouteId:' + routeId,
                    icon:     busIcon
                });
                marker.setMap(map);
                markers[gpsData.imei] = marker;
                markersCount++;
            }
            else {
                markers[gpsData.imei].setPosition(pos);
                markers[gpsData.imei].setTitle('imei:' + gpsData.imei + '\nspeed:' + gpsData.speed + '\nplateNumber:' + msg.busInfo.plateNumber +'\nrouteId:' + routeId);
                markers[gpsData.imei].setIcon(busIcon);
            }

            $(".gps-count").text(markersCount);
        });

    //Used to paint sections on the map
    $.getJSON('http://10.10.0.22/api/skeletons', function (sections) {
        var infoTemplate = "<div class='sectionInfobox'>" +
            "<span>id:__id__</span><br/>" +
            "<span>angel:__angle__</span></div>";

        sections.forEach(function(section, key) {
            var points = [];
            var point1 = new google.maps.LatLng(section.point1.latitude, section.point1.longitude);
            var point2 = new google.maps.LatLng(section.point2.latitude, section.point2.longitude);
            points.push(point1);
            points.push(point2);

            //Collect each section in polylines object with section.id key
            polylines[section.id] = new google.maps.Polyline({
                path: points,
                map: map,
                strokeColor: key % 2 ? 'blue': 'green',
                strokeOpacity: 0.8,
                strokeWeight: 4
            });

            var point = {};
            point.lat = point1.lat();
            point.lng = point1.lng();
            point = new google.maps.LatLng(point.lat,point.lng);

            var infoboxOptions = {
                content: infoTemplate.replace("__id__",section.id).replace("__angle__", section.angle),
                closeBoxURL: '',
                position: point
            };
            var ib = new InfoBox(infoboxOptions);

            google.maps.event.addListener(polylines[section.id],'mouseover', function(){
                ib.open(map, null);
            });

            google.maps.event.addListener(polylines[section.id],'mouseout', function(){
                ib.close();
            });
        });

    }).done(function(){
        for(var key in polylines){
            $.getJSON('http://10.10.0.22/api/lines/' + key + '/section/parts', function (sp) {
                for(var i = 0; i < sp.length; i++){
                    section_parts[sp[i].id] = sp[i];
                }
            });
        }
    });

    $("#show").click(function(){
        console.log(section_parts);
        var sectionId = parseInt($("#section_id").val());
        var sectionPartId = parseInt($("#section_part_id").val());

        if(polylines[sectionId]) {
            var odd = false;

            for(var i in polylines){
                polylines[i].setOptions({strokeColor: odd ? 'blue':'green',strokeWeight: 4});
                odd = !odd;
            }
            polylines[sectionId].setOptions({strokeColor: 'red',strokeWeight: 8});
        }

        if(section_parts[sectionPartId]){
            var lat1 = parseFloat(section_parts[sectionPartId].lat1);
            var lng1 = parseFloat(section_parts[sectionPartId].lng1);
            var lat2 = parseFloat(section_parts[sectionPartId].lat2);
            var lng2 = parseFloat(section_parts[sectionPartId].lng2);
            var pnt1 = new google.maps.LatLng(lat1,lng1);
            var pnt2 = new google.maps.LatLng(lat2,lng2);

            if(choosenSectionPart){
                choosenSectionPart.setMap(null);
                choosenSectionPart = null;
            }

            choosenSectionPart =  new google.maps.Polyline({
                path: [pnt1, pnt2],
                map: map,
                strokeColor: 'orange',
                strokeOpacity: 0.8,
                strokeWeight: 8
            });
        }
    });
    $("#reset").click(function(){

        var odd = false;
        for(var i in polylines){
            polylines[i].setOptions({strokeColor: odd ? 'blue':'green',strokeWeight: 4});
            odd = !odd;
        }

        if(choosenSectionPart){
            choosenSectionPart.setMap(null);
            choosenSectionPart = null;
        }
    });
});