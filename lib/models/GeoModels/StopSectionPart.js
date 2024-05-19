/**
 * Created by andranik on 6/8/15.
 */

var sequelize = require('../Sequelize');

module.exports = function(sequelize, DataTypes) {
    var StopSectionPart = sequelize.define('StopSectionPart', {
            id:  {type: DataTypes.INTEGER, primaryKey: true}
        },
        {
            tableName: 'stop_section_part',
            timestamps: false,
            underscored: true
        });

    return StopSectionPart;
};