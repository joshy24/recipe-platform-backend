'use strict'

//initialize
var express = require('express');
var router = express.Router();

//modules
require('./auth.routes')(router);
require('./user.routes')(router);

//export
module.exports = router;