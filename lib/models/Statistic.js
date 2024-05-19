/**
 * Created by andranik on 5/27/15.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Statistic', {
            section_part_id:        {type: DataTypes.STRING(20),  primaryKey: true, allowNull: false},
            pass_times_sum:         {type: DataTypes.FLOAT, allowNull: false},
            pass_count:             {type: DataTypes.INTEGER(10), allowNull: false},
            route_id:               {type: DataTypes.STRING(20), primaryKey: true, allowNull: false},
            statistic_mode_code:    {type: DataTypes.STRING(10), primaryKey: true, allowNull: false}
        },
        {
            tableName: 'statistic',
            timestamps: false,
            underscored: true
        });
};