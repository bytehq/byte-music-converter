var app = require('koa')();
var bodyParser = require('koa-body')();
var exec = require('co-exec');
var fs = require('co-fs');
var http = require('http');
var json = require('koa-json');
var request = Promise.promisifyAll(require('request'));
var router = require('koa-router');
var _s = require('underscore.string');


var converterService = require('./converter-service');


// Set up middleware
app.use(json({
    'pretty': false,
    'param': 'pretty'
}));

app.on('error', function (err) {
    logger.errorLogger.log('error', err);
    dogstatsd.increment('bytemusicconverter.errors');
    this.status = 500;
});


// Compute Engine routes
var gceRoutes = new router({
    prefix: '/_ah'
});
app.use(gceRoutes.routes());
app.use(gceRoutes.allowedMethods());
gceRoutes.get('/health', function* () {
    this.status = 200;
});
gceRoutes.get('/start', function* () {
    this.status = 200;
});
gceRoutes.get('/stop', function* () {
    this.status = 200;
    process.exit();
});


// Deploy route
gceRoutes.get('/deploy', function* () {
    var options = {
        url: 'http://metadata.google.internal/computeMetadata/v1/instance/attributes/DEPLOY_KEY',
        headers: {
            'Metadata-Flavor': 'Google'
        }
    };
    var deploy_key = yield request.getAsync(options).spread(function (response, body) {
        if (response.statusCode !== 200) throw new Error('DEPLOY_KEY fetch failed');
        return body;
    });
    if (this.header.authorization !== 'Bearer ' + deploy_key) return (this.status = 401);

    logger.info('DEPLOYING');
    var output = yield exec(__dirname + '/../git-deploy.sh');

    logger.info('FINISHED DEPLOYING');
    logger.info(output.toString());

    setTimeout(function () {
        logger.info('RESTARTING');
        process.exit();
    }, 500);
    this.status = 200;
});


// Put request logs after Compute Engine routes to filter out cruft
app.use(function* (next) {
    var start = new Date();

    var tags = [];
    var cleanMethod = _s.strLeftBack(this.url, '?');
    cleanMethod = _s.replaceAll(cleanMethod, '/', '_');
    cleanMethod = _s.trim(cleanMethod, '_');
    cleanMethod = this.method + '.' + cleanMethod;
    cleanMethod = cleanMethod.toLowerCase();
    tags.push('endpoint:' + cleanMethod);

    dogstatsd.increment('bytemusicconverter.page_views', tags);

    yield next;

    var ms = new Date() - start;
    this.set('X-Response-Time', ms + 'ms');
    logger.requestLogger.log('info', '%s %s %sms', this.method, this.url, ms);
    dogstatsd.histogram('bytemusicconverter.response_time', ms, tags);
});


app.use(function* (next) {
    if (config.env !== 'development') {
        var options = {
            url: 'http://metadata.google.internal/computeMetadata/v1/instance/attributes/API_AUTH_KEY',
            headers: {
                'Metadata-Flavor': 'Google'
            }
        };
        var apiAuthKey = yield request.getAsync(options).spread(function (response, body) {
            if (response.statusCode !== 200) throw new Error('API_AUTH_KEY fetch failed');
            return body;
        });
        if (this.header.authorization !== 'Bearer ' + apiAuthKey) return (this.status = 401);
    }

    yield next;
});


// Response wrapper
app.use(function* (next) {
    yield next;

    this.body = {
        'data': this.body,
        'success': 1
    };
});


// Set up app router
var routes = new router();
app.use(routes.routes());
app.use(routes.allowedMethods());


routes.get('/ping', function* () {
    logger.info('PING');
    yield converterService.convert('testfile', JSON.parse(yield fs.readFile('./test/testfile.json', 'utf8')));
    this.body = 'pong';
});

routes.post('/convert', bodyParser, function* () {
    var requestData = this.request.body;
    var url = yield converterService.convert(requestData.id, requestData.music);
    this.body = {
        'url': url
    };
});



// Start us up
var server;

var start = function* () {
    server = http.Server(app.callback());
    server.listen(config.port);
    logger.info('Byte-Music-Converter started on port 3000 in ' + config.env + ' mode');
};


module.exports = {
    server: server,
    start: start,
    app: app
};
