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
/**
 *
 * TODO: mongodb
 *
 */

var db = require('./db/index');
var phoneModel = db.Phone;

var twilio = require('twilio');
var current_phone_id;
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
var oneNotePagesApiUrl = 'https://www.onenote.com/api/v1.0/pages';

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

  // console.log('Find phone_number_id cookie');
  // console.log(req.headers);

  var authCode = req.query['code'];

  if (authCode) {
    // Request an access token from the auth code
    requestAccessTokenByAuthCode(authCode,
        function (responseData) {
            var accessToken = responseData['access_token'],
                refreshToken = responseData['refresh_token'],
                expiresIn = responseData['expires_in'];

            if (accessToken && refreshToken && expiresIn) {
                // Save the access token on a session. Using cookies in this case:
                // res.cookie('access_token', accessToken, { maxAge: expiresIn * 1000});
                // res.cookie('refresh_token', refreshToken);

                phoneModel.findById(current_phone_id)
                  .exec(function(err, phone) {
                    if (err) {
                      console.log('Retrieving phone number from MONGODB error');
                      return res.status(500).end();
                    }

                    if (phone == null) {
                      console.log('No phone number in MONGODB error');
                      return res.status(404).end();
                    }

                    phone.accessToken = accessToken;
                    phone.refreshToken = refreshToken;
                    phone.expiresIn = expiresIn;

                    phone.save(function(err) {
                      if (err) {
                        console.log('Error updating phone models in MONGODB');
                        res.status(500).end();
                      } else {
                        console.log('YAY, updating MONGODB success');
                        res.status(200).end();
                      }
                    })
                  })

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

app.post('/phoneNumbers', function(req, res) {
  console.log(req.body);
  
  var newPhone = new phoneModel({ number: req.body.phone });
  console.log(newPhone);
  
  newPhone.save(function(err) {
    if (err) {
      console.log('MongoDB error 1');
      res.status(500).end();
    }

    phoneModel.findById(newPhone, function(err, doc) {
      if (err) {
        console.log('MongoDB error 2');
        res.status(500).end();
      } else {
        console.log(doc.number);
        // Tack onto subsequent requests
        // res.cookie('phone_number_id', doc._id);
        current_phone_id = doc._id;
        console.log(current_phone_id);
        res.status(201).send(doc);
      } 
    })
  }); 
  
});

// Response to incoming message
app.post('/texts', function(req, res) {
  var note = req.body.Body;
  var phoneToMssg = req.body.From;
  console.log(note);
  console.log('Number is ' + req.body.From);

  // send note to OneNote
  console.log(req.cookies);

  var query = phoneModel.where({ number: phoneToMssg});
  query.findOne(function(err, phone) {
    if (err) {
      TwilioClient.messages.create({
        to: phoneToMssg,
        from: TWILIO_NUMBER,
        body: "Uh oh cannot save your note at this time"
      }, function(err, data) {
        res.send('Message is inbound!');
      });
    }

    if (phone) {

      /**
       *
       * CALL ONENOTE API here
       *
       */
      var phone_accessToken = phone.accessToken;
      var oneNotesAPIOption = {
        url: oneNotePagesApiUrl,
        headers: {'Authorization': 'Bearer ' + phone_accessToken,
                  'Content-Type': 'text/html'},
        body: note
      }
      request.post(oneNotesAPIOption, function(err) {
        if (err) {
          console.log('OneNote page with notes not created');

        }
        TwilioClient.messages.create({
          to: phoneToMssg,
          from: TWILIO_NUMBER,
          body: 'OneNote page created with your note'
        }, function(err, data) {
          res.send('Message is inbound!');
        });
      })
    }
    else {
      TwilioClient.messages.create({
        to: phoneToMssg,
        from: TWILIO_NUMBER,
        body: 'Your phone is not found in the database'
      }, function(err, data) {
        res.send('Message is inbound!');
      });
    }
  })

  TwilioClient.messages.create({
    to: phoneToMssg,
    from: TWILIO_NUMBER,
    body: 'Message is being saved to your OneNote page'
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
        console.log('Sent:', 'error.html');
      }
    });
});

app.listen(process.env.PORT || 8000);
console.log("Server listening on port localhost:8000");