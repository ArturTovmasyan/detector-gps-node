/**
 * Created by andranik on 6/4/15.
 */

var Line        = require('../models')['GeoModels/Line'];
var Route       = require('../models')['GeoModels/Route'];
var Section     = require('../models')['GeoModels/Section'];
var Stop        = require('../models')['GeoModels/Stop'];
var SectionPart = require('../models')['GeoModels/SectionPart'];


var Point       = require('../models')['GeoModels/Point'];



//var route1 = Route.build({
//    id: 9,
//    direction: '5_9'
//});
//
//var route2 = Route.build({
//    id: 10,
//    direction: '5_10'
//});
//
//var line = Line.build({
//    id:     51,
//    number: 85
//});
//
//
//line.save().then(function(){
//    route1.setLine(line, {save: false});
//    route2.setLine(line, {save: false});
//
//    route1.save().then(function (){
//        console.log('route1 saved!!!');
//
//        route2.save().then(function (){
//            console.log('route2 saved!!!');
//        })
//
//    });
//});




//
//Point.create({id: 4, latitude: 40.22, longitude: 44.554}).then(function(point1){
//    Point.create({id: 5, latitude: 40.11, longitude: 44.5254}).then(function(point2){
//    });
//});


Point.findById(4).then(function(point1){
    point1.updateAttributes({latitude: 40.11111111}).then(function(point1){
        Point.findById(5).then(function(point2){
            Section.create({id: 90, angle: 54}).then(function(section){
                section.setPoint1(point1);
                section.setPoint2(point2);
            });
        });
    });
});

//
//Section.create({id: 85, angle: 54}).then(function(section){
//    section.setPoint1(point1);
//    section.setPoint2(point2);
//});





//
//var point2 = Point.build({
//    id:        5,
//    latitude:  40.22,
//    longitude: 44.554
//});
//
//
//var section = Section.build({
//    id: 85,
//    angle: 54
//});
//
//
//point1.save().then(function(){
//    point2.save().then(function(){
//        section.setPoint1(point1, {save: false});
//        section.setPoint2(point2, {save: false});
//
//        section.save();
//    });
//});
//



//var stop = Stop.build();
//stop.id = 74;
//stop.latitude = 40.22;
//stop.longitude = 44.55;
//
//var sectionPart = SectionPart.build();
//sectionPart.id = 9;
//sectionPart.latitude = 40.555;
//sectionPart.longitude = 44.44;
//sectionPart.order = 5;
//sectionPart.distanceFromStart = 52.33;
//
//
//
//

//
//
//
//
//line.save().then(function() {
//   console.log('done!!@');
//});