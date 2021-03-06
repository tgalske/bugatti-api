if (process.env.NODE_ENV === 'develop') {
  require('dotenv').config()
}
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var membersRouter = require('./routes/members');
var quotesRouter = require('./routes/quotes');

/* CORS */
const allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
};

var index = express();

index.use(allowCrossDomain);
index.use(logger('dev'));
index.use(express.json());
index.use(express.urlencoded({ extended: false }));
index.use(cookieParser());
index.use(express.static(path.join(__dirname, 'public')));

index.use('/', indexRouter);
index.use('/members', membersRouter);
index.use('/quotes', quotesRouter.router);

module.exports = index;
