"use strict";

var fs = require('fs');
var path = require('path');
var winston = require('winston');


module.exports = function (logPath) {
    // Create logging directory if necessary.
    if (!fs.existsSync(logPath)) {
        fs.mkdirSync(logPath);
    }

    function timestamp() {
        var now = (new Date()).getTime();
        var seconds = Math.floor((new Date()).getTime() / 1000);
        var milliseconds = now - (seconds * 1000);
        var nanos = milliseconds * 1000000;
        return [seconds, nanos];
    }

    function fileFormatter(options) {
        var message;
        if (options.meta && options.meta instanceof Error && options.meta.message) {
            message = options.meta.message;
            if (options.meta.stack) {
                message += '\n';
                message += options.meta.stack;
            }
        } else {
            message = (undefined !== options.message ? options.message : '');
        }

        return JSON.stringify({
            'timestamp': {
                'seconds': options.timestamp()[0],
                'nanos': options.timestamp()[1]
            },
            'severity': options.level.toUpperCase(),
            'message': message
        });
    }

    /*
      Logger to capture all requests and output them to the console
      as well as request.log.
    */
    var requestLogger = new(winston.Logger)({
        transports: [
            new winston.transports.Console({
                colorize: true
            }),
            new winston.transports.File({
                filename: path.join(logPath, 'request.log'),
                maxsize: 1000000,
                maxFiles: 10,
                json: false,
                timestamp: timestamp,
                formatter: fileFormatter,
                tailable: true
            })
        ]
    });

    /*
      Logger to capture any top-level errors from requests and
      output them in error.log
    */
    var errorLogger = new(winston.Logger)({
        transports: [
            new winston.transports.Console({
                colorize: true
            }),
            new winston.transports.File({
                filename: path.join(logPath, 'error.log'),
                maxsize: 1000000,
                maxFiles: 10,
                json: false,
                timestamp: timestamp,
                formatter: fileFormatter,
                tailable: true,
                humanReadableUnhandledException: true
            })
        ]
    });

    /*
      General logger used for .log, .info, etc. Outputs all logs
      to the console as well as general.log.
    */
    winston.remove(winston.transports.Console);
    winston.add(winston.transports.Console, {
        colorize: true
    });
    winston.add(winston.transports.File, {
        filename: path.join(logPath, 'general.log'),
        maxsize: 1000000,
        maxFiles: 10,
        json: false,
        timestamp: timestamp,
        formatter: fileFormatter,
        tailable: true
    });

    return {
        requestLogger: requestLogger,
        errorLogger: errorLogger,
        error: winston.error,
        warn: winston.warn,
        info: winston.info,
        log: winston.log,
        verbose: winston.verbose,
        debug: winston.debug,
        silly: winston.silly
    };
};
