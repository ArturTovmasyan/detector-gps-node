/**
 * Created by andranik on 3/24/15.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('GpsData', {
            id:                     {type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true},
            imei:                   {type: DataTypes.STRING(20), allowNull: false},
            timestamp:              {type: DataTypes.DATE, allowNull: false},
            priority:               {type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false},
            longitude:              {type: DataTypes.INTEGER(4), allowNull: false},
            latitude:               {type: DataTypes.INTEGER(4), allowNull: false},
            altitude:               {type: DataTypes.INTEGER(2).UNSIGNED, allowNull: false},
            angle:                  {type: DataTypes.INTEGER(2).UNSIGNED, allowNull: false},
            satellites:             {type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false},
            speed:                  {type: DataTypes.INTEGER(2).UNSIGNED, allowNull: false},
            statistic_mode_code:    {type: DataTypes.INTEGER(4).UNSIGNED, allowNull: true},
            section_part_id:        {type: DataTypes.INTEGER(4).UNSIGNED, allowNull: true},
            route_id:               {type: DataTypes.INTEGER(4).UNSIGNED, allowNull: true}
        },
        {
            tableName: 'gps_data',
            timestamps: false,
            underscored: true,
            engine: 'ARCHIVE'
        });
};