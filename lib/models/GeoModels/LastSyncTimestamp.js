/**
 * Created by andranik on 6/8/15.
 */

var sequelize = require('../Sequelize');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('LastSyncTimestamp', {
            code:           {type: DataTypes.STRING(30), primaryKey: true},
            timestamp:      {type: DataTypes.DATE, allowNull: false}
        },
        {
            tableName: 'last_sync_timestamp',
            timestamps: false,
            underscored: true
        });
};