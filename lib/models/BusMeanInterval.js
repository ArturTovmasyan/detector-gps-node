/**
 * Created by andranik on 6/23/15.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('BusMeanInterval', {
            line_number:            {type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false},
            date:                   {type: DataTypes.DATEONLY(), allowNull: false},
            hour:                   {type: DataTypes.INTEGER(2).UNSIGNED, allowNull: false},
            interval_sum:           {type: DataTypes.FLOAT(8), allowNull: false},
            data_count:             {type: DataTypes.FLOAT(8), allowNull: false}
        },
        {
            tableName: 'bus_mean_interval',
            timestamps: false,
            underscored: true
        });
};