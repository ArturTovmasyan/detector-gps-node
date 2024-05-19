/**
 * Created by andranik on 6/3/15.
 */

var Sequelize = require('sequelize');
var db = require('../../config/parameters').database;

// initialize database connection
var sequelize = new Sequelize(
    db.name,
    db.username,
    db.password,
    {
        host: db.host,
        logging: true,
        dialectOptions: {
            timeout: db.timeout
        }
    }
);

module.exports = sequelize;