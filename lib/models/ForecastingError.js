/**
 * Created by andranik on 7/10/15.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ForecastingError', {
            line_number:    {type: DataTypes.INTEGER(4), primaryKey: true},
            date:           {type: DataTypes.DATEONLY, primaryKey: true},
            alg1_error:     {type: DataTypes.FLOAT().UNSIGNED, allowNull: false},
            alg2_error:     {type: DataTypes.FLOAT().UNSIGNED, allowNull: false},
        },
        {
            tableName: 'forecasting_error',
            timestamps: false,
            underscored: true
        });
};