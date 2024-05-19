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
    'Statistic'
];


models.forEach(function(model) {
    module.exports[model] = sequelize.import(__dirname + '/' + model);
});

//export available models
module.exports.models = models;

// export connection
module.exports.sequelize = sequelize;

