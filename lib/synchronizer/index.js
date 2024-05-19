/**
 * Created by andranik on 6/4/15.
 */

var Line        = require('../models')['GeoModels/Line'];
var Route       = require('../models')['GeoModels/Route'];
var Section     = require('../models')['GeoModels/Section'];
var Stop        = require('../models')['GeoModels/Stop'];
var SectionPart = require('../models')['GeoModels/SectionPart'];
var Point       = require('../models')['GeoModels/Point'];

var line = Line.create({
        id:     53,
        number: 85
});

var route1 = Route.create({
    id: 5,
    direction: '5_9'
});

//line.setRoutes([route1]);
//line.save().then(function() {console.log('line saved!!!')}).catch(function(error){console.log(error);});
route1.setAttribute('line', line);//  setLine(line);
//route1.save().then(function() {console.log('route1 saved!!!')}).catch(function(error){console.log(error);});
//





//route1.setLine(line).on('success', function() {console.log('route saved!!')});


//route1.save().then(function(route1){}).catch(function(error){console.log(error);});
//route2.save();


//var point1 = Point.build();
//point1.id = 4;
//point1.latitude = 40.22;
//point1.longitude = 44.554;
//
//
//var section = Section.build();
//section.id = 85;
//section.angle = 54;
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
//var point2 = Point.build();
//point2.id = 4;
//point2.latitude = 40.22;
//point2.longitude = 44.554;
//
//
//
//
//line.save().then(function() {
//   console.log('done!!@');
//});