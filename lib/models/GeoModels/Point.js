/**
 * Created by andranik on 6/3/15.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Point', {
            id:                     {type: DataTypes.INTEGER, primaryKey: true},
            latitude:               {type: DataTypes.FLOAT, allowNull: false},
            longitude:              {type: DataTypes.FLOAT, allowNull: false}
        },
        {
            tableName: 'point',
            timestamps: false,
            underscored: true
        });
};