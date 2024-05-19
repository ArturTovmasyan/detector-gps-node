/**
 * Created by andranik on 3/24/15.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('GpsStatistic', {
            imei:           {type: DataTypes.STRING(20), primaryKey: true},
            date:           {type: DataTypes.DATEONLY, primaryKey: true},
            number_valid:   {type: DataTypes.BIGINT().UNSIGNED, allowNull: false},
            number_invalid: {type: DataTypes.BIGINT().UNSIGNED, allowNull: false},
        },
        {
            tableName: 'gps_statistic',
            timestamps: false,
            underscored: true
        });
};