var express = require('express');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var morgan = require('morgan');
var csurf = require('csurf');

var path = require('path');
var cookieParser = require('cookie-parser');
var fs = require('fs');

var app = express();

app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// save Twilio and OneNote secrets in HTTP sessions
// TODO: session middleware??
// app.use(session({
//   secret: 
// }));


app.use(express.static(path.join(__dirname, '../client')));

app.get('/', function(req, res) {
  res.render('index');
});

app.listen(process.env.PORT || 8000);
console.log("Server listening on port localhost:8000");