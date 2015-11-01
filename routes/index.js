var express = require('express');
var router = express.Router();

var liveConnect = require('../server/liveconnect-client');

router.get('/', function(req, res) {
  var authUrl = liveConnect.getAuthUrl();
  console.log(authUrl);
  res.render('index', { title: 'NoteSMS', authUrl: authUrl});
});

module.exports = router;
