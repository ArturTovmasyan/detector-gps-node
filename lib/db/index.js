/**
 * Created by andranik on 3/16/15.
 */

var param = require('../../config/parameters.json').database;
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
        password: param.password
    });

    connection.connect(function (err) {
        if (err) {
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
    return connection.query(
        "SELECT * FROM :TableName AS t WHERE t.id = :id",
        { TableName: tableName,id: id },
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