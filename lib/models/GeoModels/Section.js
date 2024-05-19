/**
 * Created by andranik on 6/3/15.
 */

var sequelize = require('../Sequelize');
var Point = sequelize.import(__dirname + '/Point');

module.exports = function(sequelize, DataTypes) {
    var Section = sequelize.define('Section', {
            id:                     {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
            angle:                  {type: DataTypes.FLOAT, allowNull: false}
        },
        {
            tableName: 'section',
            timestamps: false,
            underscored: true
        });

    Section.belongsTo(Point, {as: 'Point1', foreignKey: 'point1_id'});
    Section.belongsTo(Point, {as: 'Point2', foreignKey: 'point2_id'});

    return Section;
};


