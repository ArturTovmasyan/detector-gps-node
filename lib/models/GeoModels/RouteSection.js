/**
 * Created by andranik on 6/3/15.
 */

var sequelize = require('../Sequelize');
var Route = sequelize.import(__dirname + '/Route');
var Section = sequelize.import(__dirname + '/Section');

module.exports = function(sequelize, DataTypes) {
    var RouteSection = sequelize.define('RouteSection', {
            id:                     {type: DataTypes.INTEGER, primaryKey: true},
            order:                  {type: DataTypes.INTEGER, allowNull: false},
            direction:              {type: DataTypes.INTEGER(1), allowNull: false}

        },
        {
            tableName: 'route_section',
            timestamps: false,
            underscored: true
        });


    Route.belongsToMany(Section, {through: RouteSection});
    Section.belongsToMany(Route, {through: RouteSection});

    return RouteSection;
};