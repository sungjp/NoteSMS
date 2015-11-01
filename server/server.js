var express = require('express');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
// var morgan = require('morgan');
// var csurf = require('csurf');
// var fs = require('fs');
var path = require('path');
var cookieParser = require('cookie-parser');
var twilio = require('twilio');
var config = require('./config.js');
var TWILIO_ACCOUNT_SID = config.TWILIO_ACCOUNT_SID;
    TWILIO_AUTH_TOKEN = config.TWILIO_AUTH_TOKEN;
    TWILIO_NUMBER = config.TWILIO_NUMBER;

var TwilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
var TwimlResp = new twilio.TwimlResponse();

var app = express();

app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// save Twilio and OneNote secrets in HTTP sessions??
// TODO: session middleware??
// app.use(session({
//   secret: config.secret,
//   resave: true,
//   saveUninitialized: true
// }));

app.use(express.static(path.join(__dirname, '../public')));


app.get('/', function(req, res) {
  res.render('index');
});

// Response to incoming message
app.post('/texts', function(req, res) {
  var note = req.body.Body;
  console.log(note);

  // send note to OneNote

  TwilioClient.messages.create({
    to: req.body.From,
    from: TWILIO_NUMBER,
    body: 'Good luck on your Twilio quest!'
  }, function(err, data) {
    res.send('Message is inbound!');
  });
});

// app.get('/redirect', function(req, res) {

// });

// catch 404 and forwarding to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handler
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error');
});

app.listen(process.env.PORT || 8000);
console.log("Server listening on port localhost:8000");