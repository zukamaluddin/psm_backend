var express = require('express');
var path = require('path');
var logger = require('morgan');

var bodyParser = require('body-parser');
var cors = require('cors');

var laporan = require('./routes/laporan');
var user = require('./routes/users');
var mesin = require('./routes/mesin');
var tugasan = require('./routes/tugasan');
var lantikan = require('./routes/lantikan');
var setting = require('./routes/setting');

var app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(cors({origin: '*'}));//if use cookie

// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/bernas/user', user);
app.use('/bernas/mesin', mesin);
app.use('/bernas/tugasan', tugasan);
app.use('/bernas/lantikan', lantikan);
app.use('/bernas/setting', setting);
app.use('/bernas/laporan', laporan);

app.use(function(req, res, next){
    res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
      );
      next();
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
// no stacktraces leaked to user unless in development environment
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: (app.get('env') === 'development') ? err : {}
    });
});

module.exports = app;
