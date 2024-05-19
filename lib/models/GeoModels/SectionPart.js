/**
 * Created by andranik on 6/3/15.
 */

var sequelize = require('../Sequelize');
var Section = sequelize.import(__dirname + '/Section');

module.exports = function(sequelize, DataTypes) {
    var SectionPart = sequelize.define('SectionPart', {
            id:                     {type: DataTypes.INTEGER, primaryKey: true},
            latitude:               {type: DataTypes.FLOAT, allowNull: false},
            longitude:              {type: DataTypes.FLOAT, allowNull: false},
            order:                  {type: DataTypes.INTEGER, allowNull: false},
            distanceFromStart:      {type: DataTypes.FLOAT, allowNull: false}
        },
        {
            tableName: 'section_part',
            timestamps: false,
            underscored: true
        });


    SectionPart.belongsTo(Section, {foreignKey: 'section_id'});
    Section.hasMany(SectionPart, {as: 'SectionParts'});

    return SectionPart;
};