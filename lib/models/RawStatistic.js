/**
 * Created by andranik on 5/27/15.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('RawStatistic', {
            id:                     {type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true},
            section_part_id:        {type: DataTypes.STRING(20), allowNull: false},
            interval_to_pass:       {type: DataTypes.FLOAT, allowNull: false},
            route_id:               {type: DataTypes.STRING(20), allowNull: false},
            statistic_mode_code:    {type: DataTypes.STRING(10), allowNull: false}
        },
        {
            tableName: 'raw_statistic',
            timestamps: false,
            underscored: true
        });
};