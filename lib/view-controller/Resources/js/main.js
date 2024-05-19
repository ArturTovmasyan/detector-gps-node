'use strict';

$(document).ready(function(){

    function mapInit(){
        var m,data = {};
        data.center = new google.maps.LatLng(40.1770,44.5148);
        data.zoom = 12;
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
    var bus_polylines           = {};
    var bus_section_part_marker = {};


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
            var routeId     = msg.busInfo.routeId ? msg.busInfo.routeId.toString() : "";

            if (bus_polylines[gpsData.imei]) {
                bus_polylines[gpsData.imei].setOptions({strokeColor: '#FF0000'});
            }

            if (!sectionPart && bus_section_part_marker[gpsData.imei]){
                bus_section_part_marker[gpsData.imei].setMap(null);
            }

            //If there are section part and corresponding section's polyline select it
            if (sectionPart && polylines[sectionPart.section.id]) {

                //Select corresponding polyline and save it in the bus_polylines object
                polylines[sectionPart.section.id].setOptions({strokeColor: 'blue'});
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


            var busIcon = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
            if (msg.busInfo.busStatus == "on_line"){
                if (routeId == 1){
                    busIcon = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
                }
                else if (routeId == 2){
                    busIcon = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
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
                    title:    gpsData.imei + '\n' + routeId,
                    icon:     busIcon
                });
                marker.setMap(map);
                markers[gpsData.imei] = marker;
                markersCount++;
            }
            else {
                markers[gpsData.imei].setPosition(pos);
                markers[gpsData.imei].setTitle(gpsData.imei + '\n' + routeId);
                markers[gpsData.imei].setIcon(busIcon);
            }

            $(".gps-count").text(markersCount);
        });

    //Used to paint sections on the map
    $.getJSON('http://10.10.0.22/api/skeletons', function (sections) {
        var points = [];
        var infoTemplate = "<div class='sectionInfobox'>" +
            "<span>id:__id__</span><br/>" +
            "<span>angel:__angle__</span></div>";

        sections.forEach(function(section, key) {
            var point1 = new google.maps.LatLng(section.point1.latitude, section.point1.longitude);
            var point2 = new google.maps.LatLng(section.point2.latitude, section.point2.longitude);
            points.push(point1);
            points.push(point2);

            //Collect each section in polylines object with section.id key
            polylines[section.id] = new google.maps.Polyline({
                path: points,
                map: map,
                strokeColor: key % 2 ? 'blue': 'green',
                strokeOpacity: 1.0,
                strokeWeight: 4
            });

            var point = {};
            point.lat = (point1.lat() + point2.lat()) / 2;
            point.lng = (point1.lng() + point2.lng()) / 2;
            point = new google.maps.LatLng(point.lat,point.lng);

            var infoboxOptions = {
                content: infoTemplate.replace("__id__",section.id).replace("__angle__", section.angle),
                closeBoxURL: '',
                position: point
            };
            var ib = new InfoBox(infoboxOptions);

            google.maps.event.addListener(polylines[section.id],'mouseover',function(){
                ib.open(map, null);
            });

            google.maps.event.addListener(polylines[section.id],'mouseout',function(){
                ib.close();
            });

            points = [];

//                    This part is for drawing section part center markers
//                    $.getJSON('http://10.10.0.22/api/lines/' + section.id + '/section/parts', function (section_parts) {
//                        section_parts.forEach(function(section_part) {
//                            pos = new google.maps.LatLng(section_part.latitude, section_part.longitude);
//                            marker = new google.maps.Marker({
//                                position: pos,
//                                icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
//                            });
//                            marker.setMap(map);
//                        });
//                    });
        });
    });

    //Set marker in the station place
    var pos = new google.maps.LatLng(40.171613, 44.538151);
    var marker = new google.maps.Marker({
        position: pos,
        title:"Station",
        icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
    });
    marker.setMap(map);
});