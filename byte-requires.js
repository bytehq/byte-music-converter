var done = false;

if (done === false) {
    // Replace V8's slow Promise implementation
    global.Promise = require('bluebird').Promise;
    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging') {
        Promise.longStackTraces();
        require('clarify');
    }

    global.config = require('config');
    global.config.logPath = process.env.LOG_PATH || './logs/';
    global.config.port = process.env.PORT || '3000';

    global.logger = require('./src/logger')(config.logPath);

    var StatsD = require('node-dogstatsd').StatsD;
    global.dogstatsd = new StatsD();

    if (config.env === 'production') {
        global.gcloud = require('gcloud')({
            projectId: config.gcloud.projectId
        });
    } else {
        global.gcloud = require('gcloud')({
            projectId: config.gcloud.projectId,
            keyFilename: './credentials/Byte Music Converter-681b412a5f40.json'
        });
    }

    done = true;
}
