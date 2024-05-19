/**
 * Created by andranik on 5/27/15.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('BusLastInfoId', {
            imei:           {type: DataTypes.STRING(20), primaryKey: true},
            last_record_id: {type: DataTypes.BIGINT(), allowNull: false}
        },
        {
            tableName: 'bus_last_info_id',
            timestamps: false,
            underscored: true
        });
};