/**
 * Created by andranik on 3/16/15.
 */

var param = require('../../config/parameters').database;
var mysql = require('mysql');
var log = require('../logger');

/**
 * @param errorCallback
 * @returns {*}
 */
function connect(errorCallback){
    var connection = mysql.createConnection({
        host: param.host,
        user: param.username,
        password: param.password,
        database: param.name
    });

    connection.connect(function (err) {
        if (err) {
            console.log('error');
            log.error("Error during connection " + err);
            if (errorCallback) {
                errorCallback(err);
            }
        }
    });

    return connection;
};

function findById(tableName, id, con, callback){
    var connection = null;
    if(con){
        connection = con;
    }
    else {
        connection = connect(null);
    }

    connection.config.queryFormat = function (query, values) {
        if (!values) return query;
        return query.replace(/\:(\w+)/g, function (txt, key) {
            if (values.hasOwnProperty(key)) {
                return this.escape(values[key]);
            }
            return txt;
        }.bind(this));
    };

    return connection.query(
        "SELECT * FROM "+tableName+" AS t WHERE t.id = :id",
        { id: id },
        callback
    );
};

/**
 * @type {connect}
 */
module.exports.connect = connect;

/**
 * @type {findById}
 */
module.exports.findById = findById;