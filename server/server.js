var express = require('express');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
// var morgan = require('morgan');
// var csurf = require('csurf');
// var fs = require('fs');
var path = require('path');
var cookieParser = require('cookie-parser');
var request = require('request');
var _ = require('underscore');
var engines = require('consolidate');


var config = require('./config.js');

var twilio = require('twilio');

/**
 *
 * CONFIG stuff
 *
 */

var TWILIO_ACCOUNT_SID = config.TWILIO_ACCOUNT_SID;
    TWILIO_AUTH_TOKEN = config.TWILIO_AUTH_TOKEN;
    TWILIO_NUMBER = config.TWILIO_NUMBER;

var LIVE_ID = config.LIVE_ID,
    LIVE_SECRET = config.LIVE_SECRET,
    LIVE_REDIRECT_URL = config.LIVE_REDIRECT_URL;

var TwilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
var TwimlResp = new twilio.TwimlResponse();

// var routes = require('../routes/index');
// var callback = require('../routes/callback');

var app = express();

// app.set('view', __dirname + '../public');
// app.engine('html', engines.mustache);
// app.set('view engine', 'html');
// app.engine('html', require('ejs').renderFile);
// app.set('view engine', 'html');
// app.set('views', path.join(__dirname, '../views'));
// app.set('view engine', 'jade');

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

// OAuth variables??
var oauthTokenUrl = 'https://login.live.com/oauth20_token.srf';
// var authCode;
// var accessToken;
// var refreshToken;
// var expiresIn;

/* Live Connect API request sender */
var requestAccessToken = function(data, callback) {
  request.post({url: oauthTokenUrl,
          form: _.extend({
              'client_id': LIVE_ID,
              'client_secret': LIVE_SECRET,
              'redirect_uri': LIVE_REDIRECT_URL
          }, data)},
      function (error, response, body) {
          if (error) {
              callback({});
          } else {
              callback(JSON.parse(body));
          }
      });
}

var requestAccessTokenByAuthCode = function(authCode, callback) {
  requestAccessToken({'code': authCode, 'grant_type': 'authorization_code'}, callback);
};

var requestAccessTokenByRefreshToken = function(refreshToken, callback) {
  requestAccessToken({'refresh_token': refreshToken, 'grant_type': 'refresh_token'}, callback);
};

var respOption = {
  root: __dirname + '/../views/'
}

app.get('/', function(req, res) {
  res.sendFile('index.html', respOption, function (err) {
    if (err) {
      console.log(err);
      res.status(err.status).end();
    }
    else {
      console.log('Sent:', 'index.html');
    }
  });
});

app.get('/redirect', function(req, res) {
  console.log("redirect from microsoft sign in");
  console.log('authCode:' + req.query['code']);

  var authCode = req.query['code'];

  if (authCode) {
    // Request an access token from the auth code
    requestAccessTokenByAuthCode(authCode,
        function (responseData) {
            var accessToken = responseData['access_token'],
                refreshToken = responseData['refresh_token'],
                expiresIn = responseData['expires_in'];
            console.log("Should have got accessToken, refreshToken");
            console.log("accessToken: " + accessToken);
            console.log("");
            console.log("refreshToken: " + refreshToken);
            console.log("");
            console.log("expiresIn: " + expiresIn);

            if (accessToken && refreshToken && expiresIn) {
                // Save the access token on a session. Using cookies in this case:
                res.cookie('access_token', accessToken, { maxAge: expiresIn * 1000});
                res.cookie('refresh_token', refreshToken);

                res.sendFile('callback.html', respOption, function (err) {
                  if (err) {
                    console.log(err);
                    res.status(err.status).end();
                  }
                  else {
                    console.log('Sent:', 'callback.html');
                  }
                });
            } else {
                // Handle an authentication error response
                console.log('Invalid Live Connect Response');
                console.log(JSON.stringify(responseData, null, 2));
                res.sendFile('error.html', respOption, function (err) {
                  if (err) {
                    console.log(err);
                    res.status(err.status).end();
                  }
                  else {
                    console.log('Sent:', 'index.html');
                  }
                });
            }
        });
    } else {
      // Handle an error passed from the callback query params
      var authError = req.query['error'],
          authErrorDescription = req.query['error_description'];
      console.log('Error: '+authError);
      console.log('Error description: '+authErrorDescription);
      res.sendFile('error.html', respOption, function (err) {
        if (err) {
          console.log(err);
          res.status(err.status).end();
        }
        else {
          console.log('Sent:', 'index.html');
        }
      });
    }
})
// app.use('/redirect', callback);

// app.get('/', function(req, res) {
//   res.render('index');
// });

// Response to incoming message
app.post('/texts', function(req, res) {
  var note = req.body.Body;
  console.log(note);

  // send note to OneNote
  console.log(req.cookies);

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
    res.sendFile('error.html', respOption, function (err) {
      if (err) {
        console.log(err);
        res.status(err.status).end();
      }
      else {
        console.log('Sent:', 'index.html');
      }
    });
});

app.listen(process.env.PORT || 8000);
console.log("Server listening on port localhost:8000");