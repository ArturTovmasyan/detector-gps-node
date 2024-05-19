/**
 * Created by andranik on 3/24/15.
 */

var models = require('./index');

var commands = {
    'table:create': {
        "run": tableCreate,
        "flags": {
            "-force": "To drop an existing tables and create new tables"
        },
        description: "This commands is used to create tables \n\tflags: -force To drop an existing tables and create new tables "
    }
};


function tableCreate(flags) {
    var force = false;
    var table = models.sequelize;

    for(index in flags) {

        if (flags[index] == "-force") {
            force = true;
        }
        else if (models.models.indexOf(flags[index]) !== -1) {
            table = models[flags[index]];
        }
        else {
            return false;
        }
    }

    table.sync({force: force});
    return true;
}


module.exports.commands = commands;
