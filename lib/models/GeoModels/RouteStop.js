/**
 * Created by andranik on 6/3/15.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('RouteStop', {
            id:                     {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true}

        },
        {
            tableName: 'route_stop',
            timestamps: false,
            underscored: true
        });
};