/**
 * Created by andranik on 6/3/15.
 */

var sequelize = require('../Sequelize');
var SectionPart = sequelize.import(__dirname + '/SectionPart');
var StopSectionPart = sequelize.import(__dirname + '/StopSectionPart');

module.exports = function(sequelize, DataTypes) {
    var Stop = sequelize.define('Stop', {
            id:                     {type: DataTypes.INTEGER, primaryKey: true},
            latitude:               {type: DataTypes.FLOAT, allowNull: false},
            longitude:              {type: DataTypes.FLOAT, allowNull: false}

        },
        {
            tableName: 'stop',
            timestamps: false,
            underscored: true
        });

    Stop.belongsToMany(SectionPart, {through: StopSectionPart});
    SectionPart.belongsToMany(Stop, {through: StopSectionPart});

    return Stop;
};