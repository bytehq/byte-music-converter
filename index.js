require('./byte-requires.js');
var co = require('co');

process.on('uncaughtException', function (exception) {
    console.log('Woah, uncaught exception ' + exception);
    setTimeout(function () {
        process.exit();
    }, 2000);
});

co(function* startServer() {
    yield require('./src/server').start();
}).catch(function (exception) {
    logger.errorLogger.log('Woah, uncaught exception ' + exception);
    setTimeout(function () {
        process.exit();
    }, 2000);
});
