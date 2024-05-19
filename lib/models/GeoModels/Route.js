/**
 * Created by andranik on 6/3/15.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Route', {
            id:                     {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
            direction:              {type: DataTypes.STRING(10), allowNull: false}

        },
        {
            tableName: 'route',
            timestamps: false,
            underscored: true
        });
};