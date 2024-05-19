/**
 * Created by andranik on 6/3/15.
 */

var sequelize = require('../Sequelize');
var Line = sequelize.import(__dirname + '/Line');

module.exports = function(sequelize, DataTypes) {
    var Route = sequelize.define('Route', {
            id:                     {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
            direction:              {type: DataTypes.STRING(10), allowNull: false}

        },
        {
            tableName: 'route',
            timestamps: false,
            underscored: true
        });

    Route.belongsTo(Line, {foreignKey: 'line_id'});
    Line.hasMany(Route, {as: 'Routes'});


    return Route;
};