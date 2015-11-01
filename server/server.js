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
var mongoose = require('mongoose');

mongoose.connect(config.MONGODB_URL, function(err) {
  if (err) {
    console.log(err);
  }
});
/**
 *
 * TODO: mongodb
 *
 */

var PhoneSchema = new mongoose.Schema({
  number: String,
  accessToken: String,
  refreshToken: String,
  expiresIn: Number
});

var phoneModel = mongoose.model('Phone', PhoneSchema);

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

var responseWithHTML = function(res, fileName) {
  res.sendFile(fileName, respOption, function (err) {
    if (err) {
      console.log(err);
      res.status(err.status).end();
    }
    else {
      console.log('Sent:', fileName);
    }
  });
}

app.get('/', function(req, res) {
  responseWithHTML(res, 'index.html')
});

app.get('/redirect', function(req, res) {
  console.log("===============================");
  console.log("redirect from microsoft sign in");
  console.log('authCode:  ' + req.query['code']);
  console.log("===============================");

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

                phoneModel.findOneAndUpdate({
                  "_id": current_phone_id
                }, {
                  accessToken: accessToken,
                  refreshToken: refreshToken,
                  expiresIn: expiresIn
                }, {upsert: true}, function(err, phone) {
                  if (err) {
                    console.log('===========================');
                    console.log('Error with updating MONGODB model 1');
                    console.log('===========================');
                    responseWithHTML(res, 'error.html');
                  }
                  console.log('Yay, update MONGODB model success');
                  responseWithHTML(res, 'callback.html');
                })

                console.log('===========================');
                console.log("Didn't update MONGODB");
                console.log('===========================');
                responseWithHTML(res, 'callback.html');
            } else {
                // Handle an authentication error response
                console.log('Invalid Live Connect Response');
                console.log(JSON.stringify(responseData, null, 2));
                responseWithHTML(res, 'error.html');
            }
        });
    } else {
      // Handle an error passed from the callback query params
      var authError = req.query['error'],
          authErrorDescription = req.query['error_description'];
      console.log('Error: '+authError);
      console.log('Error description: '+authErrorDescription);
      responseWithHTML(res, 'error.html');
    }
})

app.post('/phoneNumbers', function(req, res) {
  console.log(req.body);
  
  // Process req.body.phone here
  // 7143647984 -> +17143647984 
  var newPhone = new phoneModel({ number: req.body.phone });
  

  phoneModel.create({ number: req.body.phone }, function(err, phone) {
    if (err) {
      console.log('MongoDB error 1');
      res.status(500).end();
    } else {
      console.log("==================");
      console.log("New MONGODB model");
      console.log(phone);
      console.log("==================");

      current_phone_id = phone._id;
      console.log("Current phone id: " + current_phone_id);
      res.status(201).send(phone);
    }
  }); 
  
});

var TwilioMessage = function(res, phone, message) {
  TwilioClient.messages.create({
    to: phone,
    from: TWILIO_NUMBER,
    body: message
  }, function(err, data) {
    res.send('Message is inbound!');
  });
}

// Response to incoming message
app.post('/texts', function(req, res) {
  var note = req.body.Body;
  var phoneToMssg = req.body.From;
  console.log(note);
  console.log('Number is ' + req.body.From);

  /**
   *
   * Find number in DB. Retrieve accessToken if found. Call OneNote API with accessToken
   *
   */
  

  var query = phoneModel.where({ number: phoneToMssg});
  query.findOne().exec()
      .then(function(phone) {
        if (phone) {
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

            TwilioMessage(res, phoneToMssg, "OneNote page created with your note");
          })
        } else {
          TwilioMessage(res, phoneToMssg, "Uh oh your phone is not in the database");
        }
      }, function(err) {
        TwilioMessage(res, phoneToMssg, "Uh oh cannot save your note at this time");
      })
});


// Response to incoming message
app.post('/calls', function(req, res) {
  var call = req.body.Body;
  var phoneToMssg = req.body.From;
  console.log(call);
  console.log('Number is ' + req.body.From);

  /**
   *
   * Find number in DB. Retrieve accessToken if found. Call OneNote API with accessToken
   *
   */
  

  // var query = phoneModel.where({ number: phoneToMssg});
  // query.findOne().exec()
  //     .then(function(phone) {
  //       if (phone) {
  //         var phone_accessToken = phone.accessToken;
  //         var oneNotesAPIOption = {
  //           url: oneNotePagesApiUrl,
  //           headers: {'Authorization': 'Bearer ' + phone_accessToken,
  //                     'Content-Type': 'text/html'},
  //           body: note
  //         }
  //         request.post(oneNotesAPIOption, function(err) {
  //           if (err) {
  //             console.log('OneNote page with notes not created');

  //           }

  //           TwilioMessage(res, phoneToMssg, "OneNote page created with your note");
  //         })
  //       } else {
  //         TwilioMessage(res, phoneToMssg, "Uh oh your phone is not in the database");
  //       }
  //     }, function(err) {
  //       TwilioMessage(res, phoneToMssg, "Uh oh cannot save your note at this time");
  //     })
});

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

