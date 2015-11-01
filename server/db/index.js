var mongoose = require('mongoose');
var config = require('../config.js');

mongoose.connect(config.MONGODB_URL);

module.exports = {
  Phone: require('./phone.js')
};