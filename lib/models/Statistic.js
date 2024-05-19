/**
 * Created by andranik on 5/27/15.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Statistic', {
            id:               {type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true},
            section_part_id:  {type: DataTypes.STRING(20), allowNull: false},
            interval_to_pass: {type: DataTypes.FLOAT, allowNull: false},
            timestamp:        {type: DataTypes.DATE, allowNull: false}
        },
        {
            tableName: 'statistic',
            timestamps: false,
            underscored: true
        });
};