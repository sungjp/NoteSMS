var mongoose = require('mongoose');

var PhoneSchema = new mongoose.Schema({
  number: String,
  accessToken: String,
  refreshToken: String,
  expiresIn: Number
});

module.exports = mongoose.model('Phone', PhoneSchema);
