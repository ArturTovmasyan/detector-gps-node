/**
 * Created by andranik on 3/24/15.
 */

var Sequelize = require('sequelize');
var db = require('../../config/parameters').database;

// initialize database connection
var sequelize = new Sequelize(
    db.name,
    db.username,
    db.password,
    {
        host: db.host
    }
);


// load models
var models = [
    'GpsInfo'
];
models.forEach(function(model) {
    module.exports[model] = sequelize.import(__dirname + '/' + model);
});

// export connection
module.exports.sequelize = sequelize;

