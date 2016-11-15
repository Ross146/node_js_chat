var express = require('express');
var app = express();
var http = require('http');
var path = require('path');
var config = require('config');
var log = require('libs/log')(module);
var mongoose = require('libs/mongoose');
var HttpError = require('error').HttpError;

app.set('port', config.get('port'));

app.engine('ejs', require('ejs-locals'));
app.set('views', path.join(__dirname, 'templates'));
app.set('view engine', 'ejs');

app.use(express.favicon());
if(app.get('env') == 'development') {
  app.use(express.logger('dev'));
} else {
  app.use(express.logger('default'))
}

mongoose.Promise = global.Promise;

app.use(express.bodyParser());
app.use(express.cookieParser());


app.use(express.session({
    secret: config.get('session:secret'),
    key: config.get('session:key'),
    cookie: config.get('session:cookie'),
    store: require('libs/sessionStore')
}));

app.use(require('middleware/sendHttpError'));
app.use(require('middleware/loadUser'));

app.use(app.router);

require('routes')(app);

app.use(express.static(path.join(__dirname, 'public')));

app.use(function(err, req, res, next) {
  // NODE_ENV = 'production'
  if (typeof err == 'number') {
      err = new HttpError(err);
  }

  if (err instanceof HttpError) {
      res.sendHttpError(err);
  } else {
      if (app.get('env') == 'development') {
          express.errorHandler()(err, req, res, next);
      } else {
          log.error(err);
          err = new HttpError(500);
          res.sendHttpError(err);
      }
  }
});

var server = http.createServer(app);
server.listen(app.get('port'), function(){
    log.info('Express server listening on port ' + app.get('port'));
});

require('./socket')(server);