/**
 * Created by andranik on 3/24/15.
 */

var sequelize = require('./index').sequelize;

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

    for(index in flags) {

        if (flags[index] == "-force") {
            force = true;
        }
        else {
            return false;
        }
    }

    sequelize.sync({force: force});
    return true;
}


module.exports.commands = commands;
