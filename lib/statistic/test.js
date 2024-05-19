/**
 * Created by andranik on 6/23/15.
 */

var statistic = require('./index');

setInterval(function() {
    try {
        var stat = statistic.getTimeStatistics(9, 28588, 28591);
        console.log(stat.passTime);
    }
    catch(e) {
        console.log(e.message);
    }
}, 10000);