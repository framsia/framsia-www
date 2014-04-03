/* jshint node: true, strict: true */

"use strict";

var config      = require('./config.js'),
    middleware  = require('./middleware.js'),
    log         = require('./log.js'),
    ws          = require('./websocket.js'),
    express     = require('express'),
    compress    = require('compression')(),
    serveStatic = require('serve-static'),
    twitter     = require('./twitter'),
    app         = express(),
    externals   = {
        js      : (config.get('env') === 'development') ? config.get('jsFiles') : config.get('jsMinFile'),
        css     : (config.get('env') === 'development') ? config.get('cssFiles') : config.get('cssMinFile')
    };



// Load Twitter


var T = new twitter({
    consumer_key: config.get('twitterConsumerKey'),
    consumer_secret: config.get('twitterConsumerSecret'),
    access_token: config.get('twitterAccessToken'),
    access_token_secret: config.get('twitterAccessTokenSecret')
});

T.on('followMessage', function(msg){
    ws.broadcast({
        type : 'twitter:follow:message',
        data : msg
    });
});

T.on('info', function(msg){
    log.info(msg);
});

T.on('error', function(msg){
    log.error(msg);
});

T.listen();

T.follow(config.get('twitterFollowUsers'), config.get('twitterFollowQueLenght'));



// Set up websocket listeners

ws.on('connection', function(id){
    ws.send(id, {
        type: 'twitter:follow:init',
        data: T.followMessages()
    });
});



// Configure app

app.disable('x-powered-by');
app.enable('trust proxy');



// Set middleware

app.use(middleware.ensureSSL);
app.use(compress);
app.use(serveStatic(config.get('docRoot')));



// Set templating engine

app.set('views', config.get('viewRoot'));
app.set('view engine', 'ejs');



// Set http routes

app.get('/', function(req, res){
    res.render('index', {externals: externals, pageTitle: 'Framsia' });
});
app.get('/index', function(req, res){
    res.render('index', {externals: externals, pageTitle: 'Framsia' });
});



// Export application

module.exports = app;
