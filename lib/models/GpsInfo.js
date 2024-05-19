/**
 * Created by andranik on 3/24/15.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('GpsInfo', {
            id:         {type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true},
            imei:       {type: DataTypes.STRING(20), allowNull: false},
            priority:   {type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false},
            longitude:  {type: DataTypes.INTEGER(4), allowNull: false},
            latitude:   {type: DataTypes.INTEGER(4), allowNull: false},
            altitude:   {type: DataTypes.INTEGER(2).UNSIGNED, allowNull: false},
            angle:      {type: DataTypes.INTEGER(2).UNSIGNED, allowNull: false},
            satellites: {type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false},
            speed:      {type: DataTypes.INTEGER(2).UNSIGNED, allowNull: false}
        },
        {
            tableName: 'gps_info_test',
            timestamps: false,
            underscored: true,
            engine: 'ARCHIVE'
        });
};