var express = require('express');
var path = require('path');
var logger = require('morgan');
// var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');
var typeMaster = require('./config/config')['type'];

var main = require('./routes/index');
var user = require('./routes/users');
var owner = require('./routes/owner');
var branch = require('./routes/branch');
var alatan = require('./routes/alatan');
var repairer = require('./routes/repairer');
var payment = require('./routes/payment');
var report = require('./routes/report');
var bukku = require('./routes/bukku')

var jobs = require('./jobSchedule')

// var auditTrail = require('./middleware/auditTraill/index.js');
var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
// app.use(cors({origin: 'http://localhost:3001',credentials: true}));//if use cookie
app.use(cors({origin: '*'}));//if use cookie

// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use(auditTrail.trace)

app.use('/edata-be', main);
app.use('/bernas/user', user);
app.use('/edata-be/owner', owner);
app.use('/edata-be/mesin', branch);
app.use('/edata-be/alatan', alatan);
app.use('/edata-be/repairer', repairer);
app.use('/edata-be/payment', payment);
app.use('/edata-be/report', report);
app.use('/edata-be/bukku', bukku)

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

//--- list jobs
// if(typeMaster === 'master'){
//     jobs.JobsInvoice();
//     jobs.JobsContact();
// }



module.exports = app;
