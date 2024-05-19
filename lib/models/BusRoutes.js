/**
 * Created by andranik on 6/23/15.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('BusRoutes', {
            id:                    {type: DataTypes.INTEGER(4).UNSIGNED, primaryKey: true, autoIncrement: true},
            imei:                  {type: DataTypes.STRING(20), allowNull: false},
            route_id:              {type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false},
            start_date:            {type: DataTypes.DATE, allowNull: false},
            end_date:              {type: DataTypes.DATE, allowNull: false}
        },
        {
            tableName: 'bus_routes',
            timestamps: false,
            underscored: true
        });
};