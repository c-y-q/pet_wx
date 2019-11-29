const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser')
const config = require('./config/config')
const routers = require('./routes/index');
const app = express();
require('./middlewares/catcherr');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({
  limit: '100mb',
  extended: false
}));
app.use(bodyParser.json({
  limit: '100mb'
}));
app.use(bodyParser.raw({
  limit: '100mb'
}));
app.use(bodyParser.text({
  limit: '100mb'
}));
routers(app);

app.use(function (res, req, next) {
  var err = new Error()
  err.status = 404;
  err.message = `Not Found !`;
  next(err)
})
app.use(function (err, req, res, next) {
  res.json({
    status: err.status || 500,
    router: req.url,
    respMsg: err.respMsg,
    error: err.stack
  });
  console.error(err.stack);
});

module.exports = app;