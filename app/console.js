/**
 * Created by andranik on 3/24/15.
 */

var tableCommands = require("../lib/models/Table").commands;
var console = require('better-console');

var commands = {
    'help': {
        "run": showHelp,
        description: "To show all commands"
    }
};

commands = marge(commands, tableCommands);

if (!process.argv[2] || !commands[process.argv[2]]) {
    showHelp();
}
else {
    if (!commands[process.argv[2]].run(process.argv.slice(3))) {
        console.warn(process.argv[2]);
        console.log(commands[process.argv[2]].description);
    }
}

/**
 * This function is used to print all available commands
 */
function showHelp() {
    console.warn("+---------------------+");
    console.warn("| Available commands: |");
    console.warn("+---------------------+");
    for(var key in commands) {
        console.warn(key);
        console.log(commands[key].description);
    }

    console.log('\n');
    return true;
}

/**
 * This function is used to marge to objects it's return a new merged object
 *
 * @param object1
 * @param object2
 * @returns {{}}
 */
function marge(object1, object2) {
    var newObj = {};
    for(var key in object1) {
        newObj[key] = object1[key];
    }
    for(key in object2) {
        newObj[key] = object2[key];
    }

    return newObj;
}