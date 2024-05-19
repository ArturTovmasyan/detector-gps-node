/**
 * Created by andranik on 3/24/15.
 */

var sequelize = require('./Sequelize');

// load models
var models = [
    'GpsData',
    'GpsStatistic',
    'BusLastInfoId',
    'RawStatistic',
    'Statistic',
    'GeoModels/Line',
    'GeoModels/Route',
    'GeoModels/Section',
    'GeoModels/Point',
    'GeoModels/SectionPart',
    'GeoModels/Stop',
    'GeoModels/RouteSection',
    'GeoModels/RouteStop'
];


models.forEach(function(model) {
    module.exports[model] = sequelize.import(__dirname + '/' + model);
});

//export available models
module.exports.models = models;

