/**
 * Created by andranik on 3/16/15.
 */

var param = require('../../config/parameters.json').database;
var mysql = require('mysql');
var log = require('../logger');

module.exports.connect = function (callback) {

    var connection = mysql.createConnection({
        host: param.host,
        user: param.username,
        password: param.password
    });

    connection.connect(function (err) {
        if (err) {
            log.error("Error during connection " + err);
            if (callback) {
                callback(err);
            }
        }
    });

    return connection;
};