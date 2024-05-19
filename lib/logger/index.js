/**
 * Created by andranik on 3/11/15.
 */

var winston = require('winston');

winston.loggers.add('dev', {
    file: {
        level:    'debug',
        filename: 'logs/dev.log'
    }
});

winston.loggers.add('prod', {
    file: {
        filename:   'logs/prod.log',
        level:      'error'
    }
});


//module.exports = winston.loggers.get(process.env.NODE_ENV);
module.exports = winston.loggers.get('prod');
