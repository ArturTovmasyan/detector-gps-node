/**
 * Created by andranik on 6/3/15.
 */


var sequelize = require('../Sequelize');

//var Point = sequelize.import(__dirname + '/Point');
var SectionPart = sequelize.import(__dirname + '/Stop');


sequelize.sync({force: true});
//Point.sync({force: true});
//Section.sync({force: true});
