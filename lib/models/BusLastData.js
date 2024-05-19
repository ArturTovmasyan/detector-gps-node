/**
 * Created by andranik on 6/23/15.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('BusLastData', {
            imei:                   {type: DataTypes.STRING(20), primaryKey: true},
            timestamp:              {type: DataTypes.DATE, allowNull: false},
            line_number:            {type: DataTypes.INTEGER(4).UNSIGNED, allowNull: true},
            plate_number:           {type: DataTypes.STRING(6), allowNull: true}
        },
        {
            tableName: 'bus_last_data',
            timestamps: false,
            underscored: true
        });
};