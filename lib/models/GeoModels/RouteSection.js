/**
 * Created by andranik on 6/3/15.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('RouteSection', {
            id:                     {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
            order:                  {type: DataTypes.INTEGER, allowNull: false},
            direction:              {type: DataTypes.INTEGER(1), allowNull: false}

        },
        {
            tableName: 'route_section',
            timestamps: false,
            underscored: true
        });
};