
/**
 * Created by andranik on 6/3/15.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Line', {
            id:                     {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
            number:                 {type: DataTypes.INTEGER, allowNull: false}

        },
        {
            tableName: 'line',
            timestamps: false,
            underscored: true
        });
};