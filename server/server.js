var TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'ACddf9697987e2df5231b1ea82ff65b7e9';
    TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '0bac826f66b198b5bb8e7b1ca920647b';
    TWILIO_NUMBER = process.env.TWILIO_NUMBER || '+17145772793';

var express = require('express');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var morgan = require('morgan');
var csurf = require('csurf');
var twilio = require('twilio');
var TwilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
var TwimlResp = new twilio.TwimlResponse();

// Config stuff
// TODO: uncomment this
// var config = require('./config');
// var twilioNotifications = require('./middleware/twilioNotifications');

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
//   secret: config.secret,
//   resave: true,
//   saveUninitialized: true
// }));

// Mount middleware to notify Twilio of errors
// app.use(twilioNotifications.notifyOnError);


app.use(express.static(path.join(__dirname, '../client')));

app.get('/', function(req, res) {
  res.render('index');
});

app.post('/texts', function(req, res) {
  console.log(req.params);
  TwilioClient.sendSms({
    to: req.params.to,
    from: TWILIO_NUMBER,
    body: 'Good luck on your Twilio quest!'
  }, function(err, data) {
    res.send('Message is inbound!');
  });
})

//Send an SMS text message
// TwilioClient.sendMessage({
//   to:'+17143647984', // Any number Twilio can deliver to
//   from: '+17145772793', // A number you bought from Twilio and can use for outbound communication
//   body: 'word to your mother.' // body of the SMS message
// }, function(err, responseData) { //this function is executed when a response is received from Twilio

//     if (!err) { // "err" is an error received during the request, if any

//         // "responseData" is a JavaScript object containing data received from Twilio.
//         // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
//         // http://www.twilio.com/docs/api/rest/sending-sms#example-1
//         console.log(responseData.from); // outputs "+14506667788"
//         console.log(responseData.to);
//         console.log(responseData.body); // outputs "word to your mother."
//     } else {
//       console.log("Twilio error");
//     }
// });

app.listen(process.env.PORT || 8000);
console.log("Server listening on port localhost:8000");