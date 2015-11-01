// var dotenv = require('dotenv');
// var cfg = {};

// if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
//   dotenv.config({path: '.env'});
// } else {
//   dotenv.config({path: '.env.test', silent: true});
// }

// // HTTP Port to run our web application
// cfg.port = process.env.PORT || 8000;

// cfg.accountSid = process.env.TWILIO_ACCOUNT_SID;
// cfg.authToken = process.env.TWILIO_AUTH_TOKEN;
// cfg.sendingNumber = process.env.TWILIO_NUMBER;

// var requiredConfig = [cfg.accountSid, cfg.authToken, cfg.sendingNumber];
// var isConfigured = requiredConfig.every(function(configValue) {
//   return configValue || false;
// });

// if (!isConfigured) {
//   var errorMessage =
//     'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_NUMBER must be set.';

//   throw new Error(errorMessage);
// }

// // Export configuration object
// module.exports = cfg;
module.exports =  {
  LIVE_ID: process.env.LIVE_ID || '00000000481745E0',
  LIVE_SECRET: process.env.LIVE_SECRET || 'kpEn6K/2O7FCzz2d0DRAwcoChscXGiQt',
  LIVE_REDIRECT_URL: process.env.LIVE_REDIRECT_URL || 'https://32e9179f.ngrok.io/redirect',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || 'ACddf9697987e2df5231b1ea82ff65b7e9',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '0bac826f66b198b5bb8e7b1ca920647b',
  TWILIO_NUMBER: process.env.TWILIO_NUMBER || '+17145772793'
}