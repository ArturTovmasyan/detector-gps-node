/**
 * Created by andranik on 6/3/15.
 */

var sequelize = require('../Sequelize');
var Route = sequelize.import(__dirname + '/Route');
var Stop = sequelize.import(__dirname + '/Stop');

module.exports = function(sequelize, DataTypes) {
    var RouteStop = sequelize.define('RouteStop', {
            id:                     {type: DataTypes.INTEGER, primaryKey: true}

        },
        {
            tableName: 'route_stop',
            timestamps: false,
            underscored: true
        });

    Route.belongsToMany(Stop, {through: RouteStop});
    Stop.belongsToMany(Route, {through: RouteStop});

    return RouteStop;
};